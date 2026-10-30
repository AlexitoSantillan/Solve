"""Catálogo de ciudades ancladas para las capas del mapa (módulo puro).

(nombre, latitud, longitud, rango): rango 1 = ciudad mayor (se ve alejado), 2 = intermedia, 3 = se ve al acercar.
"""
from __future__ import annotations

CITIES: list[tuple[str, float, float, int]] = [
    # --- Rango 1: grandes ciudades del mundo ---
    ("Ciudad de México", 19.43, -99.13, 1), ("Nueva York", 40.71, -74.01, 1), ("Los Ángeles", 34.05, -118.24, 1),
    ("Chicago", 41.88, -87.63, 1), ("Toronto", 43.65, -79.38, 1), ("São Paulo", -23.55, -46.63, 1),
    ("Río de Janeiro", -22.91, -43.17, 1), ("Buenos Aires", -34.60, -58.38, 1), ("Bogotá", 4.71, -74.07, 1),
    ("Lima", -12.05, -77.04, 1), ("Santiago", -33.45, -70.67, 1), ("Londres", 51.51, -0.13, 1),
    ("París", 48.86, 2.35, 1), ("Madrid", 40.42, -3.70, 1), ("Berlín", 52.52, 13.40, 1), ("Roma", 41.90, 12.50, 1),
    ("Moscú", 55.76, 37.62, 1), ("Estambul", 41.01, 28.98, 1), ("El Cairo", 30.04, 31.24, 1), ("Lagos", 6.52, 3.38, 1),
    ("Nairobi", -1.29, 36.82, 1), ("Johannesburgo", -26.20, 28.05, 1), ("Ciudad del Cabo", -33.92, 18.42, 1),
    ("Dubái", 25.20, 55.27, 1), ("Riad", 24.71, 46.68, 1), ("Teherán", 35.69, 51.39, 1), ("Karachi", 24.86, 67.01, 1),
    ("Nueva Delhi", 28.61, 77.21, 1), ("Bombay", 19.08, 72.88, 1), ("Calcuta", 22.57, 88.36, 1),
    ("Bangkok", 13.76, 100.50, 1), ("Yakarta", -6.21, 106.85, 1), ("Singapur", 1.35, 103.82, 1),
    ("Manila", 14.60, 120.98, 1), ("Pekín", 39.90, 116.41, 1), ("Shanghái", 31.23, 121.47, 1),
    ("Hong Kong", 22.32, 114.17, 1), ("Seúl", 37.57, 126.98, 1), ("Tokio", 35.68, 139.65, 1),
    ("Sídney", -33.87, 151.21, 1), ("Melbourne", -37.81, 144.96, 1), ("Auckland", -36.85, 174.76, 1),
    # --- Rango 2: ciudades intermedias y capitales ---
    ("Vancouver", 49.28, -123.12, 2), ("Miami", 25.76, -80.19, 2), ("Houston", 29.76, -95.37, 2),
    ("Washington", 38.91, -77.04, 2), ("San Francisco", 37.77, -122.42, 2), ("Montreal", 45.50, -73.57, 2),
    ("La Habana", 23.11, -82.37, 2), ("Panamá", 8.98, -79.52, 2), ("Caracas", 10.48, -66.90, 2),
    ("Quito", -0.18, -78.47, 2), ("La Paz", -16.50, -68.15, 2), ("Asunción", -25.26, -57.58, 2),
    ("Montevideo", -34.90, -56.16, 2), ("Brasilia", -15.79, -47.88, 2), ("Manaos", -3.12, -60.02, 2),
    ("Recife", -8.05, -34.88, 2), ("Medellín", 6.24, -75.58, 2), ("Guayaquil", -2.17, -79.92, 2),
    ("Lisboa", 38.72, -9.14, 2), ("Barcelona", 41.39, 2.17, 2), ("Ámsterdam", 52.37, 4.90, 2), ("Viena", 48.21, 16.37, 2),
    ("Varsovia", 52.23, 21.01, 2), ("Estocolmo", 59.33, 18.07, 2), ("Oslo", 59.91, 10.75, 2), ("Helsinki", 60.17, 24.94, 2),
    ("Reikiavik", 64.15, -21.94, 2), ("Atenas", 37.98, 23.73, 2), ("Kiev", 50.45, 30.52, 2),
    ("San Petersburgo", 59.93, 30.34, 2), ("Novosibirsk", 55.03, 82.92, 2), ("Vladivostok", 43.12, 131.89, 2),
    ("Casablanca", 33.57, -7.59, 2), ("Argel", 36.75, 3.06, 2), ("Accra", 5.60, -0.19, 2), ("Dakar", 14.72, -17.47, 2),
    ("Kinsasa", -4.44, 15.27, 2), ("Adís Abeba", 9.03, 38.74, 2), ("Luanda", -8.84, 13.23, 2),
    ("Dar es Salaam", -6.79, 39.21, 2), ("Bagdad", 33.31, 44.37, 2), ("Tel Aviv", 32.09, 34.78, 2),
    ("Taskent", 41.30, 69.24, 2), ("Almaty", 43.24, 76.89, 2), ("Daca", 23.81, 90.41, 2), ("Colombo", 6.93, 79.86, 2),
    ("Katmandú", 27.72, 85.32, 2), ("Kabul", 34.53, 69.17, 2), ("Hanói", 21.03, 105.85, 2),
    ("Ho Chi Minh", 10.82, 106.63, 2), ("Kuala Lumpur", 3.14, 101.69, 2), ("Taipéi", 25.03, 121.57, 2),
    ("Ulán Bator", 47.89, 106.91, 2), ("Perth", -31.95, 115.86, 2), ("Brisbane", -27.47, 153.03, 2),
    ("Honolulu", 21.31, -157.86, 2), ("Anchorage", 61.22, -149.90, 2), ("Winnipeg", 49.90, -97.14, 2),
    ("Denver", 39.74, -104.99, 2), ("Seattle", 47.61, -122.33, 2),
    # --- Perú ---
    ("Arequipa", -16.41, -71.54, 2), ("Cusco", -13.53, -71.97, 2), ("Trujillo", -8.11, -79.03, 2),
    ("Piura", -5.19, -80.63, 2), ("Iquitos", -3.75, -73.25, 2), ("Puno", -15.84, -70.02, 2),
    ("Huancayo", -12.07, -75.21, 3), ("Chiclayo", -6.77, -79.84, 3), ("Pucallpa", -8.38, -74.55, 3),
    ("Juliaca", -15.50, -70.13, 3), ("Tacna", -18.01, -70.25, 3), ("Ayacucho", -13.16, -74.22, 3),
    ("Cajamarca", -7.16, -78.51, 3), ("Huaraz", -9.53, -77.53, 3), ("Ica", -14.07, -75.73, 3),
    ("Tumbes", -3.57, -80.45, 3), ("Tarapoto", -6.49, -76.37, 3), ("Puerto Maldonado", -12.59, -69.19, 3),
    ("Huancavelica", -12.79, -74.98, 3), ("Moquegua", -17.19, -70.93, 3), ("Abancay", -13.64, -72.88, 3),
    ("Chachapoyas", -6.23, -77.87, 3), ("Huánuco", -9.93, -76.24, 3), ("Cerro de Pasco", -10.68, -76.26, 3),
    ("Ilo", -17.64, -71.34, 3), ("Chimbote", -9.07, -78.59, 3), ("Talara", -4.58, -81.27, 3),
    ("Sechura", -5.56, -80.82, 3), ("Macusani", -14.07, -70.43, 3), ("Ilave", -16.08, -69.64, 3),
    ("Chivay", -15.64, -71.60, 3), ("Tarma", -11.42, -75.69, 3),
    # --- Latinoamérica ---
    ("Cali", 3.45, -76.53, 3), ("Barranquilla", 10.96, -74.80, 3), ("Cartagena", 10.39, -75.48, 3),
    ("Cuenca", -2.90, -79.00, 3), ("Santa Cruz", -17.78, -63.18, 3), ("Cochabamba", -17.39, -66.16, 3),
    ("Sucre", -19.03, -65.26, 3), ("Antofagasta", -23.65, -70.40, 3), ("Valparaíso", -33.05, -71.62, 3),
    ("Punta Arenas", -53.16, -70.91, 3), ("Córdoba", -31.42, -64.18, 3), ("Mendoza", -32.89, -68.84, 3),
    ("Ushuaia", -54.80, -68.30, 3), ("Salvador", -12.97, -38.50, 3), ("Fortaleza", -3.73, -38.53, 3),
    ("Belém", -1.46, -48.50, 3), ("Porto Alegre", -30.03, -51.23, 3), ("Curitiba", -25.43, -49.27, 3),
    ("Guadalajara", 20.66, -103.35, 3), ("Monterrey", 25.69, -100.32, 3), ("Cancún", 21.16, -86.85, 3),
    ("San José", 9.93, -84.08, 3), ("Guatemala", 14.63, -90.51, 3), ("Santo Domingo", 18.49, -69.93, 3),
    ("San Juan", 18.47, -66.11, 3), ("Managua", 12.11, -86.24, 3), ("Tegucigalpa", 14.07, -87.19, 3),
    ("San Salvador", 13.69, -89.19, 3), ("Cayena", 4.92, -52.31, 3), ("Paramaribo", 5.85, -55.20, 3),
    ("Georgetown", 6.80, -58.16, 3),
    # --- Resto del mundo (se ven al acercar) ---
    ("Edmonton", 53.55, -113.49, 3), ("Halifax", 44.65, -63.57, 3), ("Dallas", 32.78, -96.80, 3),
    ("Atlanta", 33.75, -84.39, 3), ("Phoenix", 33.45, -112.07, 3), ("Boston", 42.36, -71.06, 3),
    ("Múnich", 48.14, 11.58, 3), ("Milán", 45.46, 9.19, 3), ("Praga", 50.08, 14.44, 3), ("Budapest", 47.50, 19.04, 3),
    ("Bucarest", 44.43, 26.10, 3), ("Belgrado", 44.79, 20.45, 3), ("Dublín", 53.35, -6.26, 3),
    ("Edimburgo", 55.95, -3.19, 3), ("Sevilla", 37.39, -5.98, 3), ("Túnez", 36.81, 10.18, 3),
    ("Trípoli", 32.89, 13.19, 3), ("Jartum", 15.50, 32.56, 3), ("Mogadiscio", 2.05, 45.32, 3),
    ("Abiyán", 5.36, -4.01, 3), ("Maputo", -25.97, 32.57, 3), ("Lusaka", -15.39, 28.32, 3),
    ("Harare", -17.83, 31.05, 3), ("Windhoek", -22.56, 17.08, 3), ("Antananarivo", -18.88, 47.51, 3),
    ("Mascate", 23.59, 58.41, 3), ("Doha", 25.29, 51.53, 3), ("Bakú", 40.41, 49.87, 3), ("Tiflis", 41.72, 44.79, 3),
    ("Ereván", 40.18, 44.51, 3), ("Lahore", 31.55, 74.34, 3), ("Chennai", 13.08, 80.27, 3), ("Bangalore", 12.97, 77.59, 3),
    ("Rangún", 16.84, 96.17, 3), ("Phnom Penh", 11.56, 104.93, 3), ("Chengdú", 30.57, 104.07, 3),
    ("Urumqi", 43.83, 87.62, 3), ("Lhasa", 29.65, 91.12, 3), ("Osaka", 34.69, 135.50, 3), ("Sapporo", 43.06, 141.35, 3),
    ("Port Moresby", -9.44, 147.18, 3), ("Suva", -18.14, 178.44, 3), ("Darwin", -12.46, 130.84, 3),
    ("Adelaida", -34.93, 138.60, 3), ("Wellington", -41.29, 174.78, 3), ("Papeete", -17.54, -149.57, 3),
    ("Nuuk", 64.18, -51.72, 3), ("Yakutsk", 62.04, 129.74, 3), ("Múrmansk", 68.97, 33.08, 3), ("Tromsø", 69.65, 18.96, 3),
]


def cities_in_bbox(south: float, west: float, north: float, east: float, limit: int = 100) -> list[tuple[str, float, float, int]]:
    """Ciudades dentro del recuadro, las más importantes primero (a igual rango, orden estable por nombre)."""
    inside = [c for c in CITIES if south <= c[1] <= north and west <= c[2] <= east]
    inside.sort(key=lambda c: (c[3], c[0]))
    return inside[:limit]
