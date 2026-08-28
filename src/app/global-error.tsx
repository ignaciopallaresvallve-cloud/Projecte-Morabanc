"use client";

/**
 * Solo se activa si falla el propio layout raíz (muy poco frecuente). Al
 * sustituir por completo el layout, no hereda globals.css ni las fuentes:
 * por eso usa estilos en línea en vez de las clases de Tailwind del resto
 * de la app.
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ca">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#ffffff",
          color: "#212529",
        }}
      >
        <div style={{ display: "flex", maxWidth: 360, flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0a3550" }}>
            Alguna cosa ha anat malament
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#898989" }}>
            S&apos;ha produït un error inesperat en carregar MoraBanc Office
            Store. Torna-ho a provar d&apos;aquí a uns instants.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: 8,
              height: 44,
              padding: "0 24px",
              borderRadius: 6,
              border: "none",
              background: "#f1c657",
              color: "#0a3550",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Torna-ho a provar
          </button>
        </div>
      </body>
    </html>
  );
}
