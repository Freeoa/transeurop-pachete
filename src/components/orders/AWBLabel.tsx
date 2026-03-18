import { useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Order } from '../../types';
import { formatDate, getOrderTypeLabel } from '../../utils';
import { useDataStore } from '../../contexts/DataStoreContext';

interface AWBLabelProps {
  order: Order;
}

export function AWBLabel({ order }: AWBLabelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const store = useDataStore();
  const route = store.state.routes.find((r) => r.id === order.routeId);

  const handlePrint = useCallback(() => {
    if (!ref.current) return;
    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>AWB ${order.awb}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; padding: 16px; }
        .label { border: 2px solid #1a1d23; border-radius: 6px; padding: 16px; max-width: 380px; margin: 0 auto; }
        .awb { font-size: 22px; font-weight: 700; letter-spacing: 1px; text-align: center; margin-bottom: 8px; font-family: 'JetBrains Mono', monospace; }
        .route { font-size: 14px; text-align: center; margin-bottom: 12px; color: #374151; }
        .qr { text-align: center; margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
        .grid dt { color: #6b7280; font-weight: 500; }
        .grid dd { color: #111827; margin-bottom: 6px; }
        .divider { border-top: 1px dashed #d1d5db; margin: 10px 0; }
        .type { display: inline-block; background: #e0e7ff; color: #3730a3; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; margin-bottom: 8px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${ref.current.innerHTML}
      <script>window.onload=function(){window.print();window.close();}</script>
      </body></html>
    `);
    printWindow.document.close();
  }, [order.awb]);

  const senderName = order.expeditor ?? order.numePasager ?? order.proprietar ?? '—';
  const senderPhone = order.telefonExpeditor ?? order.telefonPasager ?? order.telefonProprietar ?? '';
  const receiverName = order.destinatar ?? order.numePasager ?? order.proprietar ?? '—';
  const receiverPhone = order.telefonDestinatar ?? order.telefonPasager ?? order.telefonProprietar ?? '';

  return (
    <>
      <div ref={ref} className="hidden">
        <div className="label">
          <div className="type">{getOrderTypeLabel(order.type)}</div>
          <div className="awb">{order.awb}</div>
          <div className="route">{route ? `${route.origin} → ${route.destination}` : '—'}</div>
          <div className="qr">
            <QRCodeSVG value={`${window.location.origin}/track/${order.awb}`} size={120} />
          </div>
          <div className="divider" />
          <dl className="grid">
            <dt>Expeditor</dt>
            <dd>{senderName}</dd>
            <dt>Telefon</dt>
            <dd>{senderPhone}</dd>
            <dt>Destinatar</dt>
            <dd>{receiverName}</dd>
            <dt>Telefon</dt>
            <dd>{receiverPhone}</dd>
            <dt>Ridicare</dt>
            <dd>{order.adresaRidicare}</dd>
            <dt>Livrare</dt>
            <dd>{order.adresaLivrare}</dd>
            {order.greutate && <><dt>Greutate</dt><dd>{order.greutate} kg</dd></>}
            {order.lungime && order.latime && order.inaltime && (
              <><dt>Dimensiuni</dt><dd>{order.lungime}×{order.latime}×{order.inaltime} cm</dd></>
            )}
            <dt>Data</dt>
            <dd>{formatDate(order.dataCreare)}</dd>
          </dl>
        </div>
      </div>
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-border text-[13px] text-text-secondary hover:bg-bg-secondary transition-colors"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-3 0h.008v.008h-.008V12Z" />
        </svg>
        Imprimă AWB
      </button>
    </>
  );
}
