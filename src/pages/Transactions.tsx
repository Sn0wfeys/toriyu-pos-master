import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  transaction_date: string;
  quantity: number;
  unit_type: string;
  price_per_unit: number;
  total_amount: number;
  notes: string | null;
  products: {
    name: string;
    size: string;
  } | null;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales_transactions")
        .select(`
          *,
          products (name, size)
        `)
        .order("transaction_date", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memuat riwayat transaksi",
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
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Riwayat Transaksi</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">Memuat transaksi...</div>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Belum ada transaksi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {transaction.products?.name || "Produk Tidak Diketahui"} - {transaction.products?.size || ""}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(transaction.transaction_date), "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">Rp {Number(transaction.total_amount).toLocaleString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Jumlah</p>
                      <p className="font-semibold">
                        {transaction.quantity} {transaction.unit_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Harga per {transaction.unit_type}</p>
                      <p className="font-semibold">Rp {Number(transaction.price_per_unit).toLocaleString()}</p>
                    </div>
                    {transaction.notes && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Catatan</p>
                        <p className="font-semibold">{transaction.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
