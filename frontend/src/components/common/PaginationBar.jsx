import React from 'react';

export default function PaginationBar({ currentPage, totalRecords, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  if (totalRecords === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200/80 rounded-b-2xl text-xs text-slate-500">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-slate-800">{startRecord}</strong> to{' '}
          <strong className="text-slate-800">{endRecord}</strong> of{' '}
          <strong className="text-slate-800">{totalRecords}</strong> records
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto font-medium">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition font-semibold"
        >
          Previous
        </button>
        <span className="px-2 font-bold text-slate-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition font-semibold"
        >
          Next
        </button>
      </div>
    </div>
  );
}
