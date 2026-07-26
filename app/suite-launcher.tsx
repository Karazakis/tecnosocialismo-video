export const suiteLinks = [
  { label: "Home", href: "https://tecnosocialismo.com", mark: "T" },
  { label: "Iskra", href: "https://iskra.tecnosocialismo.com", mark: "I" },
  { label: "Rizoma", href: "https://rizoma.tecnosocialismo.com", mark: "R" },
  { label: "Cloud", href: "https://cloud.tecnosocialismo.com", mark: "C" },
  { label: "Mail", href: "https://mail.tecnosocialismo.com", mark: "M" },
  { label: "Video", href: "https://video.tecnosocialismo.com", mark: "V", current: true },
  { label: "Social", href: "https://social.tecnosocialismo.com", mark: "S" },
  { label: "Account", href: "https://login.tecnosocialismo.com", mark: "A" },
];

export function SuiteLauncher() {
  return <details className="service-launcher"><summary aria-label="Apri tutti i servizi"><span aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span></summary><div><p>UN ECOSISTEMA · UN ACCOUNT</p>{suiteLinks.map((link) => <a className={link.current ? "current" : ""} aria-current={link.current ? "page" : undefined} href={link.href} key={link.label}><i>{link.mark}</i>{link.label}<b>↗</b></a>)}</div></details>;
}
