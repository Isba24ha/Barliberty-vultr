import { useBarStore } from "@/store/useBarStore";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Receipt, FileText, Table, Wallet, CreditCard, Smartphone, Coffee, Calculator } from "lucide-react";
import { PT } from "@/lib/i18n";
import { formatCurrency } from "@/lib/currency";

export function StatsCards() {
  const { sessionStats, activeSession } = useBarStore();

  const sessionInfo = activeSession ? 
    `Sessão ${activeSession.shiftType === 'morning' ? 'Manhã' : 'Tarde'} - ${new Date(activeSession.startTime).toLocaleDateString('pt-PT')}` 
    : 'Nenhuma sessão ativa';

  return (
    <div className="mb-8">
      {/* Session Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Estatísticas da Sessão Atual</h3>
            <p className="text-sm text-gray-400">{sessionInfo}</p>
          </div>
          {activeSession && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Iniciada às</p>
              <p className="text-sm text-white font-medium">
                {new Date(activeSession.startTime).toLocaleTimeString('pt-PT', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cash Register Summary - Destacando a diferença entre vendas e dinheiro em caixa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-green-900 to-green-800 border-green-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-200">Total de Vendas da Sessão</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(sessionStats?.totalSales || "0")}</p>
                <p className="text-xs text-green-200 mt-1">Incluindo todos os métodos de pagamento</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-900 to-emerald-800 border-emerald-600">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-200">Dinheiro Físico em Caixa</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(sessionStats?.cashInRegister || "0")}</p>
                <p className="text-xs text-emerald-200 mt-1">Apenas pagamentos em dinheiro</p>
              </div>
              <Wallet className="w-12 h-12 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 truncate">Pagamentos a Crédito</p>
                <p className="text-lg font-bold text-blue-400 truncate">{formatCurrency(sessionStats?.creditPayments || "0")}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 bg-opacity-20 flex-shrink-0 ml-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">Pag. faturas de crédito</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 truncate">Mobile Money</p>
                <p className="text-lg font-bold text-cyan-400 truncate">{formatCurrency(sessionStats?.mobileMoneyPayments || "0")}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-500 bg-opacity-20 flex-shrink-0 ml-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">Pagamentos mobile money</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 truncate">Consumo Gerente</p>
                <p className="text-lg font-bold text-yellow-400 truncate">{formatCurrency(sessionStats?.managerConsumption || "0")}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500 bg-opacity-20 flex-shrink-0 ml-2">
                <Coffee className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">Consumo do gerente</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 truncate">Transações Totais</p>
                <p className="text-lg font-bold text-purple-400 truncate">{sessionStats?.transactionCount || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500 bg-opacity-20 flex-shrink-0 ml-2">
                <Receipt className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">Número de transações</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 truncate">Créditos Ativos</p>
                <p className="text-lg font-bold text-orange-400 truncate">{formatCurrency(sessionStats?.activeCredits || "0")}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-500 bg-opacity-20 flex-shrink-0 ml-2">
                <FileText className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">Créditos pendentes</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 truncate">Mesas Ocupadas</p>
                <p className="text-lg font-bold text-pink-400 truncate">{sessionStats?.occupiedTables || 0}/{sessionStats?.totalTables || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-500 bg-opacity-20 flex-shrink-0 ml-2">
                <Table className="w-5 h-5 text-pink-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 truncate">{Math.round(((sessionStats?.occupiedTables || 0) / (sessionStats?.totalTables || 1)) * 100)}% ocupação</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
