export const suiteLinks = [
  { label: "Home", href: "https://tecnosocialismo.com", mark: "T" },
  { label: "Rizoma", href: "https://rizoma.tecnosocialismo.com", mark: "R" },
  { label: "Iskra", href: "https://iskra.tecnosocialismo.com", mark: "I" },
  { label: "Cloud", href: "https://cloud.tecnosocialismo.com", mark: "C" },
  { label: "Mail", href: "https://mail.tecnosocialismo.com", mark: "M" },
  { label: "Video", href: "https://video.tecnosocialismo.com", mark: "V", current: true },
  { label: "Musica", href: "https://musica.tecnosocialismo.com", mark: "U" },
  { label: "Social", href: "https://social.tecnosocialismo.com", mark: "S" },
  { label: "Messaggi", href: "https://messaggi.tecnosocialismo.com", mark: "G" },
  { label: "Sport", href: "https://sport.tecnosocialismo.com", mark: "F" },
  { label: "Market", href: "https://market.tecnosocialismo.com", mark: "K" },
  { label: "Lavoro", href: "https://lavoro.tecnosocialismo.com", mark: "L" },
  { label: "Azienda", href: "https://azienda.tecnosocialismo.com", mark: "Z" },
  { label: "Servizi", href: "https://servizi.tecnosocialismo.com", mark: "E" },
  { label: "Salute", href: "https://salute.tecnosocialismo.com", mark: "SA" },
  { label: "Educazione", href: "https://educazione.tecnosocialismo.com", mark: "ED" },
  { label: "Legge", href: "https://legge.tecnosocialismo.com", mark: "LE" },
  { label: "Burocrazia", href: "https://burocrazia.tecnosocialismo.com", mark: "BU" },
  { label: "Biblioteca", href: "https://biblioteca.tecnosocialismo.com", mark: "B" },
  { label: "Militant", href: "https://militant.tecnosocialismo.com", mark: "P" },
  { label: "Account", href: "https://login.tecnosocialismo.com", mark: "A" },
];

export function SuiteLauncher() {
  return <details className="service-launcher"><summary aria-label="Apri tutti i servizi"><span aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span></summary><div><p>UN ECOSISTEMA · UN ACCOUNT</p>{suiteLinks.map((link) => <a className={link.current ? "current" : ""} aria-current={link.current ? "page" : undefined} href={link.href} key={link.label}><i>{link.mark}</i>{link.label}<b>↗</b></a>)}</div></details>;
}
