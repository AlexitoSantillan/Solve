"""Pruebas del motor de riesgo. Ejecutar:  python -m unittest discover -s tests -v
(no requieren red ni FastAPI)."""
import unittest

from app.risk import (RULES, Level, assess_from_open_meteo, classify, rules_as_dict)


def payload(hours=28, apparent=22.0, temp=22.0, rain=0.0, gust=15.0, pressure=1010.0, overrides=None):
    """Genera una respuesta sintética tipo Open-Meteo: 3 h pasadas + hora actual + 24 h futuras."""
    times = [f"2026-10-29T{h % 24:02d}:00" if h < 24 else f"2026-10-30T{h % 24:02d}:00" for h in range(hours)]
    hourly = {
        "time": times,
        "apparent_temperature": [apparent] * hours,
        "temperature_2m": [temp] * hours,
        "precipitation": [rain] * hours,
        "wind_gusts_10m": [gust] * hours,
        "surface_pressure": [pressure] * hours,
    }
    for k, v in (overrides or {}).items():
        hourly[k] = v
    return {"current": {"time": "2026-10-29T03:00"}, "hourly": hourly}


class ClassifyTests(unittest.TestCase):
    def test_limites_ge(self):
        r = RULES["viento_rachas"]
        self.assertEqual(classify(49.9, r), Level.BAJO)
        self.assertEqual(classify(50, r), Level.MODERADO)
        self.assertEqual(classify(75, r), Level.ALTO)
        self.assertEqual(classify(100, r), Level.CRITICO)

    def test_limites_le_frio(self):
        r = RULES["frio"]
        self.assertEqual(classify(-4.9, r), Level.BAJO)
        self.assertEqual(classify(-5, r), Level.MODERADO)
        self.assertEqual(classify(-15, r), Level.ALTO)
        self.assertEqual(classify(-30, r), Level.CRITICO)

    def test_umbrales_ordenados(self):
        for r in RULES.values():
            if r.direction == "ge":
                self.assertLess(r.moderate, r.high)
                self.assertLess(r.high, r.critical)
            else:
                self.assertGreater(r.moderate, r.high)
                self.assertGreater(r.high, r.critical)


class AssessmentTests(unittest.TestCase):
    def test_condiciones_tranquilas_dan_bajo(self):
        a = assess_from_open_meteo(payload())
        self.assertEqual(a.level, Level.BAJO)
        self.assertEqual(a.color, "green")
        self.assertEqual(a.evaluated_factors, 7)
        self.assertEqual(a.drivers, [])

    def test_calor_extremo_es_critico_y_rojo(self):
        a = assess_from_open_meteo(payload(apparent=52.0))
        self.assertEqual(a.level, Level.CRITICO)
        self.assertEqual(a.color, "red")
        self.assertIn("Estrés térmico", a.drivers)

    def test_calor_alto_es_naranja(self):
        a = assess_from_open_meteo(payload(apparent=40.0))
        self.assertEqual((a.level, a.color), (Level.ALTO, "orange"))

    def test_nivel_global_es_el_maximo(self):
        a = assess_from_open_meteo(payload(gust=80.0, rain=1.0))
        self.assertEqual(a.level, Level.ALTO)
        self.assertEqual(a.drivers, ["Rachas de viento"])

    def test_lluvia_acumulada_24h(self):
        a = assess_from_open_meteo(payload(rain=2.0))  # 24 h x 2 mm = 48 mm
        f = next(x for x in a.factors if x.id == "lluvia_acumulada")
        self.assertEqual(f.value, 48.0)
        self.assertEqual(f.level, Level.MODERADO)

    def test_ignora_horas_pasadas(self):
        rain = [60.0, 60.0, 60.0] + [0.0] * 25  # lluvia solo en las 3 h pasadas
        a = assess_from_open_meteo(payload(overrides={"precipitation": rain}))
        f = next(x for x in a.factors if x.id == "lluvia_intensidad")
        self.assertEqual(f.level, Level.BAJO)

    def test_cambio_brusco_de_temperatura(self):
        temps = [20.0] * 10 + [34.0] * 18  # salto de 14 °C en una hora
        a = assess_from_open_meteo(payload(overrides={"temperature_2m": temps}))
        f = next(x for x in a.factors if x.id == "cambio_temperatura")
        self.assertEqual(f.level, Level.ALTO)

    def test_caida_de_presion(self):
        p = [1010.0] * 10 + [1007.0, 1004.0, 1002.0] + [1002.0] * 15  # 8 hPa en 3 h
        a = assess_from_open_meteo(payload(overrides={"surface_pressure": p}))
        f = next(x for x in a.factors if x.id == "caida_presion")
        self.assertEqual(f.value, 8.0)
        self.assertEqual(f.level, Level.ALTO)

    def test_presion_que_sube_no_es_riesgo(self):
        p = [1000.0 + i for i in range(28)]
        a = assess_from_open_meteo(payload(overrides={"surface_pressure": p}))
        f = next(x for x in a.factors if x.id == "caida_presion")
        self.assertEqual(f.level, Level.BAJO)

    def test_datos_nulos_no_se_inventan(self):
        a = assess_from_open_meteo(payload(overrides={"wind_gusts_10m": [None] * 28}))
        f = next(x for x in a.factors if x.id == "viento_rachas")
        self.assertFalse(f.evaluated)
        self.assertEqual(a.evaluated_factors, 6)

    def test_sin_datos(self):
        a = assess_from_open_meteo({})
        self.assertEqual(a.evaluated_factors, 0)
        self.assertIn("Sin datos", a.summary)

    def test_siempre_declara_que_es_experimental(self):
        a = assess_from_open_meteo(payload())
        self.assertEqual(a.kind, "experimental_indicator")
        self.assertIn("No es una alerta oficial", a.disclaimer)

    def test_reglas_serializables(self):
        rules = rules_as_dict()
        self.assertEqual(len(rules), 7)
        self.assertTrue(all(r["basis"] for r in rules))


if __name__ == "__main__":
    unittest.main()
