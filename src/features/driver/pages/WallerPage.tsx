import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard
} from 'lucide-react';
import DriverNavbar from '../components/DriverNavbar';
import GlobalLoading from '@/shared/components/loaders/GlobalLoading';
import { fetchData } from '@/shared/services/api/api-service';
import DriverApiEndpoints from '@/constants/driver-api-end-pontes';
import { ResponseCom } from '@/shared/types/common';

// Types
interface Transaction {
  id: string;
  type: 'payout' | 'transfer';
  amount: number;
  currency: string;
  status: string;
  created: number;
  arrival_date?: number;
  description?: string;
}

interface WalletData {
  hasAccount: boolean;
  onboardingComplete?: boolean;
  accountLinkUrl?: string;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  balance?: {
    available: Array<{ amount: number; currency: string }>;
    pending: Array<{ amount: number; currency: string }>;
  };
  transactions?: {
    payouts: any[];
    transfers: any[];
  };
  email?: string;
  message?: string;
}

const DriverWallet = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
       const response = await fetchData<ResponseCom["data"]>(DriverApiEndpoints.WALLET)

      const data = await response?.data;
      console.log("wdata",data);
      
      if(response?.status == 200 && data){
          setWalletData(data);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshOnboarding = async () => {
    try {
      setRefreshing(true);
      
      const response = await fetchData<ResponseCom["data"]>(DriverApiEndpoints.REFRESH_ONBOARDING)
      const data =  response?.data;
      if (data.accountLinkUrl) {
        window.location.href = data.accountLinkUrl;
      }
    } catch (error) {
      console.error('Error refreshing onboarding:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8c58c] via-[#f5e5c8] to-[#ffffff] pb-20 sm:pb-4 sm:pl-64">
        <DriverNavbar />
        <GlobalLoading isLoading={loading} loadingMessage="loading account details" />
      </div>
    );
  }

  // No Account State
  if (!walletData?.hasAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdb726] via-[#f5e5c8] to-[#ffffff] pt-20 sm:pt-6 pb-24 sm:pb-6 sm:pl-64 px-4 sm:px-8">
            <DriverNavbar/>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-xl rounded-3xl p-8 sm:p-12 text-center border-2 border-[#fdb726]/20">
            <div className="bg-gradient-to-br from-[#fdb726] to-[#f5a623] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Wallet className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No Wallet Account</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              {walletData?.message || 'Your wallet account is being set up. Please contact support if this persists.'}
            </p>
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 max-w-md mx-auto">
              <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
              <p className="text-sm text-yellow-800">
                Your Stripe account will be created when an admin approves your driver application.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Incomplete Onboarding State
  if (!walletData.onboardingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdb726] via-[#f5e5c8] to-[#ffffff] pt-20 sm:pt-6 pb-24 sm:pb-6 sm:pl-64 px-4 sm:px-8">
        <DriverNavbar/>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border-2 border-[#fdb726]/30">
            <div className="bg-gradient-to-r from-[#fdb726] to-[#f5a623] px-8 py-12 text-center">
              <div className="bg-white/20 backdrop-blur-sm w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-white/30">
                <CreditCard className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">Complete Your Stripe Setup</h1>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                You're almost there! Complete your Stripe onboarding to start receiving payments.
              </p>
            </div>

            <div className="p-8 sm:p-12">
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4 p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                  <div className="bg-green-500 rounded-full p-2 flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Account Created</h3>
                    <p className="text-sm text-gray-600">Your Stripe account has been successfully created</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-200">
                  <div className="bg-yellow-500 rounded-full p-2 flex-shrink-0 animate-pulse">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">Onboarding Pending</h3>
                    <p className="text-sm text-gray-600">Complete your information to receive payments</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border-2 border-blue-100">
                <h3 className="font-bold text-xl text-gray-900 mb-4">What you'll need:</h3>
                <ul className="space-y-3">
                  {[
                    'Government-issued ID (Driver\'s License or Passport)',
                    'Social Security Number or Tax ID',
                    'Bank account information for payouts',
                    'Business details (if applicable)',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => window.location.href = walletData.accountLinkUrl!}
                  className="w-full bg-gradient-to-r from-[#fdb726] to-[#f5a623] hover:from-[#f5a623] hover:to-[#fdb726] text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 text-lg group"
                >
                  <span>Continue Onboarding</span>
                  <ExternalLink className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleRefreshOnboarding}
                  disabled={refreshing}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-2xl transition-all duration-300 border-2 border-gray-200 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh Onboarding Link'}</span>
                </button>
              </div>

              <p className="text-sm text-gray-500 text-center mt-6">
                Secured by Stripe • Your information is safe and encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Complete Wallet View
  const availableBalance = walletData.balance?.available[0]?.amount || 0;
  const pendingBalance = walletData.balance?.pending[0]?.amount || 0;
  const currency = walletData.balance?.available[0]?.currency || 'usd';

  const allTransactions: Transaction[] = [
    ...(walletData.transactions?.payouts.map(p => ({ ...p, type: 'payout' as const })) || []),
    ...(walletData.transactions?.transfers.map(t => ({ ...t, type: 'transfer' as const })) || []),
  ].sort((a, b) => b.created - a.created);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdb726] via-[#f5e5c8] to-[#ffffff] pt-20 sm:pt-6 pb-24 sm:pb-6 sm:pl-64 px-4 sm:px-8">
     <DriverNavbar/>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600 text-lg">Manage your earnings and transactions</p>
        </div>

        {/* Status Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-xl rounded-2xl p-6 mb-8 border-2 border-green-400/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">Account Active</h3>
                <p className="text-green-50 text-sm">Ready to receive payments</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">
                {walletData.chargesEnabled ? 'Charges Enabled' : 'Charges Pending'} • 
                {walletData.payoutsEnabled ? ' Payouts Enabled' : ' Payouts Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Available Balance */}
          <div className="bg-gradient-to-br from-[#fdb726] to-[#f5a623] shadow-2xl rounded-3xl p-8 border-2 border-[#fdb726]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold text-lg">Available Balance</h3>
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-5xl font-bold text-white mb-2">
                {formatCurrency(availableBalance, currency)}
              </p>
              <p className="text-white/80 text-sm">Ready for payout</p>
            </div>
          </div>

          {/* Pending Balance */}
          <div className="bg-white shadow-xl rounded-3xl p-8 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-semibold text-lg">Pending Balance</h3>
              <div className="bg-gradient-to-br from-[#fdb726] to-[#f5a623] rounded-full p-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-5xl font-bold text-gray-900 mb-2">
              {formatCurrency(pendingBalance, currency)}
            </p>
            <p className="text-gray-600 text-sm">Processing payments</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(availableBalance + pendingBalance, currency)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{allTransactions.length}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Account Email</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{walletData.email}</p>
              </div>
              <Wallet className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white shadow-xl rounded-3xl overflow-hidden border-2 border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
            <p className="text-gray-600 text-sm mt-1">Your payment history and payouts</p>
          </div>

          <div className="overflow-x-auto">
            {allTransactions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-600">Your transactions will appear here once you start earning</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {allTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="px-8 py-6 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className={`rounded-full p-3 flex-shrink-0 ${
                          transaction.type === 'payout'
                            ? 'bg-green-100'
                            : 'bg-blue-100'
                        }`}>
                          {transaction.type === 'payout' ? (
                            <ArrowDownLeft className="w-6 h-6 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 mb-1 capitalize">
                            {transaction.type}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {transaction.description || `${transaction.type} transaction`}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              transaction.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {transaction.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(transaction.created)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-2xl font-bold ${
                          transaction.type === 'payout'
                            ? 'text-green-600'
                            : 'text-blue-600'
                        }`}>
                          {transaction.type === 'payout' ? '-' : '+'}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                        {transaction.arrival_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Arrives {formatDate(transaction.arrival_date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="bg-blue-500 rounded-full p-3 flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Need Help?</h3>
              <p className="text-gray-700 mb-4">
                If you have questions about your payments or encounter any issues with your wallet, 
                our support team is here to help.
              </p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-xl transition-colors duration-200">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverWallet;