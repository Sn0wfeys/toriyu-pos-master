import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
  LogOut,
  Plus,
  FileText,
  DollarSign,
} from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    todaySales: 0,
    todayRevenue: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadStats();
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadStats = async () => {
    try {
      // Get products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get low stock products
      const { data: products } = await supabase
        .from("products")
        .select("current_stock_units, minimum_stock_units")
        .eq("is_active", true);

      const lowStockCount = products?.filter(
        (p) => p.current_stock_units <= p.minimum_stock_units
      ).length || 0;

      // Get today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todaySalesData } = await supabase
        .from("sales_transactions")
        .select("total_amount")
        .gte("transaction_date", today.toISOString());

      const salesCount = todaySalesData?.length || 0;
      const revenue = todaySalesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

      setStats({
        totalProducts: productsCount || 0,
        lowStock: lowStockCount,
        todaySales: salesCount,
        todayRevenue: revenue,
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Berhasil keluar",
      description: "Sampai jumpa lagi!",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">TW</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Toriyu Water POS</h1>
              <p className="text-xs text-muted-foreground">Sistem Kasir & Manajemen Stok</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Produk
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Produk aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Stok Menipis
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.lowStock}</div>
              <p className="text-xs text-muted-foreground mt-1">Perlu restock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Penjualan Hari Ini
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todaySales}</div>
              <p className="text-xs text-muted-foreground mt-1">Transaksi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendapatan Hari Ini
              </CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                Rp {stats.todayRevenue.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total penjualan</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            size="lg"
            className="h-32 flex flex-col gap-2"
            onClick={() => navigate("/sales")}
          >
            <ShoppingCart className="h-8 w-8" />
            <span className="text-base font-semibold">Transaksi Penjualan</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-32 flex flex-col gap-2"
            onClick={() => navigate("/products")}
          >
            <Package className="h-8 w-8" />
            <span className="text-base font-semibold">Kelola Produk</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-32 flex flex-col gap-2"
            onClick={() => navigate("/purchase")}
          >
            <Plus className="h-8 w-8" />
            <span className="text-base font-semibold">Pembelian Stok</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="h-32 flex flex-col gap-2"
            onClick={() => navigate("/reports")}
          >
            <TrendingUp className="h-8 w-8" />
            <span className="text-base font-semibold">Laporan</span>
          </Button>
        </div>

        {/* Quick Link to History */}
        <div className="mt-8">
          <Button
            variant="link"
            onClick={() => navigate("/history")}
            className="text-primary"
          >
            <FileText className="mr-2 h-4 w-4" />
            Lihat Riwayat Transaksi
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
