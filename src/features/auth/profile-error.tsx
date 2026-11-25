import { logout } from "./actions";

/**
 * Angemeldet, aber kein lesbares Profil (fehlender DB-Eintrag oder fehlende
 * Rechte). Statt im Kreis umzuleiten, zeigen wir den Fehler und bieten Abmelden an.
 */
export function ProfileError() {
  return (
    <div className="card text-center">
      <p className="font-semibold text-danger">Dein Profil konnte nicht geladen werden.</p>
      <p className="mt-2 text-sm text-muted">
        Die Anmeldung hat geklappt, aber zu deinem Konto fehlt das Profil in der Datenbank oder
        die App darf es nicht lesen. Bitte Benedikt Bescheid geben.
      </p>
      <form action={logout} className="mt-4">
        <button className="btn-secondary w-full">Abmelden</button>
      </form>
    </div>
  );
}
