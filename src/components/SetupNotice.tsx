export function SetupNotice() {
  return (
    <main className="login">
      <div className="login__card">
        <p className="section-label">Oppsett mangler</p>
        <h1 className="login__title">Nesten der</h1>
        <p className="login__lead">
          Appen finner ikke Supabase. Lag en fil som heter <code>.env</code> i rotmappen
          med disse to linjene, og start utviklingsserveren på nytt.
        </p>
        <pre className="code">
{`VITE_SUPABASE_URL=https://ditt-prosjekt.supabase.co
VITE_SUPABASE_ANON_KEY=din-anon-nokkel`}
        </pre>
        <p className="login__note">
          Begge finnes i Supabase under Project Settings, API. Anon-nøkkelen er ment å være
          offentlig. Service role-nøkkelen skal aldri inn her.
        </p>
      </div>
    </main>
  )
}
