import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ShoppingCart, Package } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  name: string;
  size: string;
  selling_price_per_unit: number;
  selling_price_per_box: number;
  current_stock_units: number;
  units_per_box: number;
}

const Sales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitType, setUnitType] = useState<"botol" | "dus">("botol");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast({
        title: "Gagal memuat produk",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProducts(data || []);
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    
    if (unitType === "dus") {
      return selectedProduct.selling_price_per_box * quantity;
    }
    return selectedProduct.selling_price_per_unit * quantity;
  };

  const getAvailableStock = () => {
    if (!selectedProduct) return 0;
    
    if (unitType === "dus") {
      return Math.floor(selectedProduct.current_stock_units / selectedProduct.units_per_box);
    }
    return selectedProduct.current_stock_units;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast({
        title: "Pilih produk",
        description: "Silakan pilih produk terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const availableStock = getAvailableStock();
    if (quantity > availableStock) {
      toast({
        title: "Stok tidak cukup",
        description: `Stok tersedia: ${availableStock} ${unitType}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const pricePerUnit = unitType === "dus" 
        ? selectedProduct.selling_price_per_box 
        : selectedProduct.selling_price_per_unit;

      const { error } = await supabase.from("sales_transactions").insert({
        product_id: selectedProduct.id,
        quantity,
        unit_type: unitType,
        price_per_unit: pricePerUnit,
        total_amount: calculateTotal(),
        created_by: user.id,
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: "Transaksi berhasil!",
        description: `Penjualan ${quantity} ${unitType} ${selectedProduct.name} ${selectedProduct.size} berhasil dicatat`,
      });

      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setUnitType("botol");
      setNotes("");
      loadProducts(); // Reload to update stock
    } catch (error: any) {
      toast({
        title: "Transaksi gagal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Transaksi Penjualan</h1>
            <p className="text-sm text-muted-foreground">Input penjualan produk</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Form Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product">Produk</Label>
                <Select
                  value={selectedProduct?.id}
                  onValueChange={(value) => {
                    const product = products.find((p) => p.id === value);
                    setSelectedProduct(product || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.size} (Stok: {product.current_stock_units} botol)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unitType">Satuan</Label>
                      <Select
                        value={unitType}
                        onValueChange={(value: "botol" | "dus") => setUnitType(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="botol">Botol</SelectItem>
                          <SelectItem value="dus">Dus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Jumlah</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={getAvailableStock()}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Harga per {unitType}:</span>
                      <span className="font-semibold">
                        Rp {(unitType === "dus" 
                          ? selectedProduct.selling_price_per_box 
                          : selectedProduct.selling_price_per_unit
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Stok tersedia:</span>
                      <span className="font-semibold flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {getAvailableStock()} {unitType}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-primary">
                        Rp {calculateTotal().toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan (Opsional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Catatan tambahan untuk transaksi ini..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/admin")}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || !selectedProduct}
                >
                  {loading ? "Memproses..." : "Simpan Transaksi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Sales;
