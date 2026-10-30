"""Pruebas de dashboard, anomalías y malla. Ejecutar: python -m unittest discover -s tests -v"""
import unittest
from datetime import date

from app.anomaly import compare, window_sample, anomaly_report
from app.dashboard import current_block, daily_rows, hourly_next_hours
from app.cities import CITIES, cities_in_bbox
from app.grid import FIELD_CHUNK, FIELD_LATS, FIELD_LONS, field_matrices, field_points
from app.grid import MAX_POINTS, build_points, lattice_points, parse_grid, snap_bbox, snap_grid


class DashboardTests(unittest.TestCase):
    def raw(self):
        times = [f"2026-10-29T{h:02d}:00" for h in range(24)] + [f"2026-10-30T{h:02d}:00" for h in range(6)]
        n = len(times)
        return {
            "current": {"time": "2026-10-29T10:00", "temperature_2m": 21.5, "weather_code": 3, "is_day": 1},
            "hourly": {"time": times, "temperature_2m": [float(i) for i in range(n)],
                       "precipitation": [None] * n},
            "daily": {"time": ["2026-10-29"], "weather_code": [61], "temperature_2m_max": [25.0],
                      "temperature_2m_min": [None]},
        }

    def test_hourly_empieza_en_la_hora_actual_y_limita(self):
        rows = hourly_next_hours(self.raw(), 24)
        self.assertEqual(rows[0]["time"], "2026-10-29T10:00")
        self.assertEqual(len(rows), 20)  # de 10:00 a 05:00 del día siguiente
        self.assertEqual(hourly_next_hours(self.raw(), 5)[-1]["time"], "2026-10-29T14:00")

    def test_nulos_se_conservan_como_none(self):
        self.assertIsNone(hourly_next_hours(self.raw())[0]["precipitation"])
        self.assertIsNone(daily_rows(self.raw())[0]["temp_min"])

    def test_daily_y_current(self):
        d = daily_rows(self.raw())[0]
        self.assertEqual((d["weather_code"], d["temp_max"]), (61, 25.0))
        c = current_block(self.raw())
        self.assertEqual((c["temperature"], c["weather_code"], c["is_day"]), (21.5, 3, True))

    def test_vacio(self):
        self.assertEqual(hourly_next_hours({}), [])
        self.assertEqual(daily_rows({}), [])


class AnomalyTests(unittest.TestCase):
    def history(self):
        dates, vals = [], []
        for year in range(2016, 2026):
            for day in range(15, 30):  # 15 días de octubre por año -> 150 datos
                dates.append(date(year, 10, day).isoformat())
                vals.append(20.0 + (day % 5))  # 20..24
        return dates, vals

    def test_ventana_circular_y_filtro(self):
        dates, vals = self.history()
        sample = window_sample(dates, vals + [None], date(2026, 10, 22), 3)
        self.assertTrue(all(isinstance(x, float) for x in sample))
        self.assertLess(len(sample), len(vals))
        self.assertEqual(window_sample(["2026-01-01"], [10.0], date(2026, 12, 30), 7), [10.0])  # circular

    def test_valor_normal(self):
        _, vals = self.history()
        r = compare(22.0, vals)
        self.assertTrue(r["available"])
        self.assertEqual(r["direction"], "normal")

    def test_valor_extremo_alto(self):
        _, vals = self.history()
        r = compare(35.0, vals)
        self.assertEqual(r["direction"], "alto")
        self.assertEqual(r["percentile"], 100.0)
        self.assertIn("Extremadamente", r["status"])

    def test_muestra_insuficiente_no_inventa(self):
        r = compare(22.0, [20.0, 21.0])
        self.assertFalse(r["available"])

    def test_precipitacion_menor_al_umbral_es_normal(self):
        r = compare(0.2, [0.0] * 100, ignore_below=1.0)
        self.assertEqual(r["direction"], "normal")

    def test_informe_completo(self):
        dates, vals = self.history()
        archive = {"time": dates, "temperature_2m_max": vals, "temperature_2m_min": vals,
                   "precipitation_sum": [0.0] * len(vals), "wind_speed_10m_max": vals}
        today = {"temp_max": 40.0, "temp_min": 22.0, "precipitation_sum": 0.0, "wind_speed_max": None}
        rep = anomaly_report(today, archive, date(2026, 10, 22))
        self.assertIn("Temperatura máxima", rep["flagged"])
        wind = next(v for v in rep["variables"] if v["id"] == "wind")
        self.assertFalse(wind["available"])


class GridTests(unittest.TestCase):
    def test_snap_contiene_el_recuadro_original(self):
        s, w, n, e = snap_bbox(-13.3, -78.1, -10.9, -75.2)
        self.assertLessEqual(s, -13.3); self.assertGreaterEqual(n, -10.9)
        self.assertLessEqual(w, -78.1); self.assertGreaterEqual(e, -75.2)

    def test_snap_limita_polos_y_antimeridiano(self):
        s, w, n, e = snap_bbox(-120, -200, 120, 200)
        self.assertEqual((s, n), (-85.0, 85.0))
        self.assertEqual((w, e), (-180.0, 180.0))

    def test_snap_es_estable_para_pequenos_desplazamientos(self):
        self.assertEqual(snap_bbox(-13.30, -78.10, -10.90, -75.20), snap_bbox(-13.25, -78.05, -10.95, -75.25))

    def test_puntos_dentro_y_cantidad(self):
        pts = build_points(-10, -80, 0, -70, 6, 8)
        self.assertEqual(len(pts), 48)
        self.assertTrue(all(-10 < la < 0 and -80 < lo < -70 for la, lo in pts))
        with self.assertRaises(ValueError):
            build_points(0, 0, 1, 1, 11, 10)
        self.assertLessEqual(48, MAX_POINTS)

    def test_puntos_anclados_a_lugares_fijos(self):
        a = snap_grid(-14.0, -78.0, -8.0, -70.0)
        b = snap_grid(-13.2, -77.1, -9.1, -71.3)  # mapa desplazado, mismo nivel de zoom
        self.assertEqual(a[4], b[4])
        pa, pb = set(lattice_points(*a)), set(lattice_points(*b))
        self.assertTrue(pb & pa)
        self.assertTrue(all(abs(la / a[4] - round(la / a[4])) < 1e-6 for la, _ in pa))

    def test_cantidad_acotada_a_cualquier_zoom(self):
        for box in [(-85, -180, 85, 180), (-30, -90, 10, -40), (-14, -78, -8, -70), (-12.5, -77.5, -11.5, -76.5)]:
            g = snap_grid(*box)
            self.assertLessEqual(len(lattice_points(*g)), MAX_POINTS)
            self.assertGreaterEqual(len(lattice_points(*g)), 4)

    def test_al_acercar_se_conservan_los_puntos_previos(self):
        lejos = set(lattice_points(-14.0, -78.0, -8.0, -70.0, 2.0))
        cerca = set(lattice_points(-14.0, -78.0, -8.0, -70.0, 1.0))
        self.assertTrue(lejos and lejos <= cerca)
        self.assertGreater(len(cerca), len(lejos))

    def test_ciudades_en_recuadro_y_orden_por_importancia(self):
        peru = cities_in_bbox(-19, -82, 0, -68)
        self.assertTrue(any(c[0] == "Cusco" for c in peru))
        self.assertTrue(all(-19 <= c[1] <= 0 and -82 <= c[2] <= -68 for c in peru))
        self.assertEqual([c[3] for c in peru], sorted(c[3] for c in peru))
        self.assertLessEqual(len(cities_in_bbox(-85, -180, 85, 180)), 100)
        self.assertEqual(len({c[0] for c in CITIES}), len(CITIES))
        self.assertTrue(all(-90 <= c[1] <= 90 and -180 <= c[2] <= 180 for c in CITIES))

    def test_campo_global_forma_y_limites(self):
        pts = field_points()
        self.assertEqual(len(pts), len(FIELD_LATS) * len(FIELD_LONS))
        self.assertLessEqual(len(pts), 600)  # límite por minuto de Open-Meteo (gratis)
        self.assertTrue(all(-90 < la < 90 and -180 <= lo < 180 for la, lo in pts))
        self.assertGreater(FIELD_CHUNK, 0)

    def test_campo_global_matrices_y_vacios(self):
        pts = field_points()
        items = [{"current": {"temperature_2m": 20.04, "precipitation": 0, "wind_speed_10m": 5}} for _ in pts]
        items[3] = {"current": {"temperature_2m": None}}
        m = field_matrices(items)
        self.assertEqual((len(m["temperature"]), len(m["temperature"][0])), (len(FIELD_LATS), len(FIELD_LONS)))
        self.assertEqual(m["temperature"][0][0], 20.0)
        self.assertIsNone(m["temperature"][0][3])
        self.assertIsNone(m["wind_speed"][0][3])
        self.assertEqual(len(field_matrices([])["temperature"][0]), len(FIELD_LONS))

    def test_parse_agrega_nombre(self):
        ok = {"latitude": 1.0, "longitude": 2.0, "current": {"temperature_2m": 20, "precipitation": 0, "wind_speed_10m": 5}}
        out = parse_grid([ok], [(1.0, 2.0)], [{"name": "X", "rank": 1}])
        self.assertEqual(out[0]["name"], "X")

    def test_parse_lista_objeto_y_descarta_incompletos(self):
        pts = [(1.0, 2.0), (3.0, 4.0), (5.0, 6.0)]
        ok = {"latitude": 1.0, "longitude": 2.0,
              "current": {"temperature_2m": 20, "precipitation": 0, "wind_speed_10m": 5, "time": "t"}}
        bad = {"current": {"temperature_2m": None, "precipitation": 0, "wind_speed_10m": 5}}
        out = parse_grid([ok, bad, ok], pts)
        self.assertEqual(len(out), 2)
        self.assertEqual(len(parse_grid(ok, pts[:1])), 1)


if __name__ == "__main__":
    unittest.main()
