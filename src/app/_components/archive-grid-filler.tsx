type Props = {
  context?: string;
};

export function ArchiveGridFiller({ context = "ARCHIVO" }: Props) {
  return (
    <aside className="archive-grid-filler" aria-hidden="true">
      <div className="archive-grid-filler__bar"><span><i /> <i /> <i /></span><span>~/cd/{context.toLowerCase()}</span><span>×</span></div>
      <div className="archive-grid-filler__screen">
        <p><b>$</b> tail -f publicaciones.log<span className="archive-grid-filler__cursor">_</span></p>
        <p className="archive-grid-filler__muted">[ok] índice sincronizado</p>
        <p className="archive-grid-filler__muted">[ok] señales recibidas</p>
        <div className="archive-grid-filler__meter"><i /><i /><i /><i /><i /><i /></div>
        <p className="archive-grid-filler__message">ESPERANDO LA<br />SIGUIENTE ENTRADA</p>
      </div>
      <div className="archive-grid-filler__footer"><span>CD / ARCHIVE NODE</span><span>STANDBY</span></div>
    </aside>
  );
}
