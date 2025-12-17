import React, { useState, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout";
import IssuesList from "../../components/issueList";
import { cn } from "@/shared/lib/utils";
import { fetchData } from "@/shared/services/api/api-service";
import { usePaginatedSearch } from "@/shared/hooks/usePaginatedSearch";
import { AdminApiEndpoints } from "@/constants/admin-api-end-pointes";
import { SearchInput } from "@/shared/components/SearchInput";
import { Pagination } from "@/shared/components/Pagination";
import { useJsApiLoader } from "@react-google-maps/api";
import {
  libraries,
} from "@/constants/map-options"
const Issues: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "resolved" | "reissued">(
    "pending"
  );
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    libraries,
  });

  const fetchIssues = useCallback(
    async ({ page, limit, search, signal }: any) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
        ...(search ? { search } : {}),
      });

      const data = await fetchData<{
        issues: any[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
        };
      }>(`${AdminApiEndpoints.ISSUES}?${params}`, signal);
      const res = data?.data;
      return {
        data: res?.issues || [],
        pagination: res?.pagination || {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: limit,
        },
      };
    },
    [activeTab]
  );

  const {
    data: issues,
    loading,
    pagination,
    searchTerm,
    setSearchTerm,
    setPage,
    refresh,
  } = usePaginatedSearch({
    fetchFn: fetchIssues,
    itemsPerPage: 6,
    debounceMs: 500,
  });

  const handleTabChange = (tab: "pending" | "resolved" | "reissued") => {
    setActiveTab(tab);
    setSearchTerm("");
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
          Issue Management
        </h1>

        <div className="mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => handleTabChange("pending")}
              disabled={loading}
              className={cn(
                "px-4 py-2 text-sm font-medium border rounded-l-lg transition-colors",
                activeTab === "pending"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-100",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              Pending Issues
              {activeTab === "pending" && pagination.totalItems > 0 && (
                <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs">
                  {pagination.totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("resolved")}
              disabled={loading}
              className={cn(
                "px-4 py-2 text-sm font-medium border-t border-b transition-colors",
                activeTab === "resolved"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-100",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              Resolved Issues
              {activeTab === "resolved" && pagination.totalItems > 0 && (
                <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs">
                  {pagination.totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabChange("reissued")}
              disabled={loading}
              className={cn(
                "px-4 py-2 text-sm font-medium border rounded-r-lg transition-colors",
                activeTab === "reissued"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-900 border-gray-200 hover:bg-gray-100",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              Reissued
              {activeTab === "reissued" && pagination.totalItems > 0 && (
                <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs">
                  {pagination.totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by ride ID or user name..."
            loading={loading}
            className="max-w-sm"
          />
        </div>

        <IssuesList
          issues={issues}
          status={activeTab}
          loading={loading}
          onUpdateSuccess={refresh}
        />

        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          loading={loading}
          itemName="issues"
        />
      </div>
    </AdminLayout>
  );
};

export default Issues;