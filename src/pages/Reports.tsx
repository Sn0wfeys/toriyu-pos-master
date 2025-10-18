import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, TrendingDown, Package, ShoppingCart } from "lucide-react";

interface ReportStats {
  totalSales: number;
  totalPurchases: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  topProducts: Array<{
    name: string;
    size: string;
    sales_count: number;
    total_revenue: number;
  }>;
}

const Reports = () => {
  const [stats, setStats] = useState<ReportStats>({
    totalSales: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    totalCost: 0,
    profit: 0,
    topProducts: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data: salesData } = await supabase
        .from("sales_transactions")
        .select(`
          total_amount,
          quantity,
          product_id,
          products (name, size)
        `);

      const { data: purchasesData } = await supabase
        .from("purchase_orders")
        .select("total_amount");

      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const totalCost = purchasesData?.reduce((sum, purchase) => sum + Number(purchase.total_amount), 0) || 0;

      const productSales = salesData?.reduce((acc: any, sale: any) => {
        const productId = sale.product_id;
        if (!acc[productId]) {
          acc[productId] = {
            name: sale.products?.name || "Unknown",
            size: sale.products?.size || "",
            sales_count: 0,
            total_revenue: 0,
          };
        }
        acc[productId].sales_count += sale.quantity;
        acc[productId].total_revenue += Number(sale.total_amount);
        return acc;
      }, {});

      const topProducts = Object.values(productSales || {})
        .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      setStats({
        totalSales: salesData?.length || 0,
        totalPurchases: purchasesData?.length || 0,
        totalRevenue,
        totalCost,
        profit: totalRevenue - totalCost,
        topProducts: topProducts as any,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memuat laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Laporan Bisnis</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">Memuat laporan...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalSales}</div>
                  <p className="text-xs text-muted-foreground">Transaksi</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPurchases}</div>
                  <p className="text-xs text-muted-foreground">Pembelian</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Rp {stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Dari penjualan</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estimasi Profit</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    Rp {stats.profit.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Pendapatan - Biaya</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Produk Terlaris</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topProducts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Belum ada data penjualan</p>
                ) : (
                  <div className="space-y-4">
                    {stats.topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                        <div>
                          <p className="font-semibold">{product.name} - {product.size}</p>
                          <p className="text-sm text-muted-foreground">{product.sales_count} unit terjual</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">Rp {product.total_revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
