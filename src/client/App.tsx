function NotFound(): React.JSX.Element {
  return (
    <main className="page-shell">
      <section className="card" aria-labelledby="not-found-title">
        <p className="eyebrow">Family Call</p>
        <h1 id="not-found-title">This page could not be found</h1>
        <p>The family call is available from the main family link.</p>
        <a className="primary-link" href="/family">Go to Family Call</a>
      </section>
    </main>
  );
}

function FamilyPage(): React.JSX.Element {
  return (
    <main className="page-shell">
      <section className="card" aria-labelledby="family-call-title">
        <div className="family-mark" aria-hidden="true">FC</div>
        <p className="eyebrow">Private family room</p>
        <h1 id="family-call-title">Family Call</h1>
        <p>The secure family call setup is being prepared.</p>
        <p className="status" role="status">Checking access</p>
      </section>
    </main>
  );
}

export function App(): React.JSX.Element {
  return window.location.pathname === "/family" ? <FamilyPage /> : <NotFound />;
}
