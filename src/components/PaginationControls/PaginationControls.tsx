import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Items per page selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
            Show
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              onItemsPerPageChange(value);
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value={totalItems}>All</option>
          </select>
          <span className="text-sm text-gray-700">per page</span>
        </div>

        {/* Results counter */}
        <div className="text-sm text-gray-700">
          Showing {startIndex + 1} to {endIndex} of {totalItems} items
        </div>

        {/* Page navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            ◀
          </button>

          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              if (pageNum === 1 || pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="px-2">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
