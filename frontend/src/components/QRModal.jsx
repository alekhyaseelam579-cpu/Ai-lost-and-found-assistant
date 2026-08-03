import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, ShieldCheck, Copy, Check } from 'lucide-react';

export default function QRModal({ item, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const qrPayload = item.qr_code_hash || `AILOSTFOUND:VERIFY:item_id=${item.id}:name=${item.name}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <QrCode className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Item Verification QR Code</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Scan this code at campus lost & found office to claim ownership.
            </p>
          </div>

          {/* QR Code Graphic */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center mx-auto w-56 h-56">
            <QRCodeSVG value={qrPayload} size={180} level="H" includeMargin={true} />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left text-xs space-y-1 font-mono">
            <p className="text-slate-400 text-[10px] uppercase font-sans font-bold">Item ID & Hash</p>
            <p className="truncate text-slate-700 dark:text-slate-300 font-semibold">{item.name}</p>
            <p className="text-slate-500 truncate">{item.id}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Hash' : 'Copy Verification Payload'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
