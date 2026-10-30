import { useCallback, useEffect, useState } from "react";

export type Route = "/" | "/comunidades" | "/mapa" | "/riesgo" | "/impacto" | "/acerca";
const ROUTES: Route[] = ["/", "/comunidades", "/mapa", "/riesgo", "/impacto", "/acerca"];

function read(): Route {
  const h = window.location.hash.replace(/^#/, "") || "/";
  return (ROUTES as string[]).includes(h) ? (h as Route) : "/";
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((r: Route) => {
    window.location.hash = r;
  }, []);
  return [route, go];
}
