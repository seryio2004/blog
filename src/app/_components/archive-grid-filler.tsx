import { copy, type Locale } from "@/lib/i18n";

type Props = {
  context?: string;
  locale?: Locale;
};

export function ArchiveGridFiller({ context = "ARCHIVO", locale = "es" }: Props) {
  const text = copy[locale];
  return (
    <aside className="archive-grid-filler" aria-hidden="true">
      <div className="archive-grid-filler__bar"><span><i /> <i /> <i /></span><span>~/cd/{context.toLowerCase()}</span><span>×</span></div>
      <div className="archive-grid-filler__screen">
        <p><b>$</b> tail -f {text.filler.log}<span className="archive-grid-filler__cursor">_</span></p>
        <p className="archive-grid-filler__muted">{text.filler.synced}</p>
        <p className="archive-grid-filler__muted">{text.filler.signals}</p>
        <div className="archive-grid-filler__meter"><i /><i /><i /><i /><i /><i /></div>
        <p className="archive-grid-filler__message">{text.filler.waiting[0]}<br />{text.filler.waiting[1]}</p>
      </div>
      <div className="archive-grid-filler__footer"><span>CD / ARCHIVE NODE</span><span>STANDBY</span></div>
    </aside>
  );
}
