import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  size: string;
  purchase_price_per_unit: number;
  units_per_box: number;
  current_stock_units: number;
}

const StockPurchases = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unitType, setUnitType] = useState<"botol" | "dus">("botol");
  const [supplierName, setSupplierName] = useState("");
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
        title: "Error",
        description: "Gagal memuat produk",
        variant: "destructive",
      });
      return;
    }

    setProducts(data || []);
  };

  const calculateTotal = () => {
    if (!selectedProduct || !quantity) return 0;
    const qty = parseInt(quantity);
    if (unitType === "dus") {
      return qty * selectedProduct.units_per_box * selectedProduct.purchase_price_per_unit;
    }
    return qty * selectedProduct.purchase_price_per_unit;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !quantity || !supplierName) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang wajib",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Anda harus login terlebih dahulu",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("purchase_orders").insert({
        product_id: selectedProduct.id,
        quantity: parseInt(quantity),
        unit_type: unitType,
        purchase_price_per_unit: selectedProduct.purchase_price_per_unit,
        total_amount: calculateTotal(),
        supplier_name: supplierName.trim(),
        notes: notes.trim() || null,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Pembelian stok berhasil dicatat",
      });

      setSelectedProduct(null);
      setQuantity("");
      setSupplierName("");
      setNotes("");
      loadProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan pembelian",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Pembelian Stok</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Pembelian Stok</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="product">Produk *</Label>
                <Select
                  value={selectedProduct?.id || ""}
                  onValueChange={(value) => {
                    const product = products.find((p) => p.id === value);
                    setSelectedProduct(product || null);
                  }}
                >
                  <SelectTrigger id="product">
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
                      <Label htmlFor="quantity">Jumlah *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Masukkan jumlah"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unitType">Satuan *</Label>
                      <Select value={unitType} onValueChange={(value: "botol" | "dus") => setUnitType(value)}>
                        <SelectTrigger id="unitType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="botol">Botol</SelectItem>
                          <SelectItem value="dus">Dus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Nama Supplier *</Label>
                    <Input
                      id="supplier"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Masukkan nama supplier"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan tambahan (opsional)"
                      rows={3}
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Harga per {unitType}:</span>
                      <span className="font-semibold">
                        Rp {unitType === "dus" 
                          ? (selectedProduct.purchase_price_per_unit * selectedProduct.units_per_box).toLocaleString()
                          : selectedProduct.purchase_price_per_unit.toLocaleString()
                        }
                      </span>
                    </div>
                    {quantity && (
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>Rp {calculateTotal().toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(null);
                        setQuantity("");
                        setSupplierName("");
                        setNotes("");
                      }}
                      className="flex-1"
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Menyimpan..." : "Simpan Pembelian"}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockPurchases;
