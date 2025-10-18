import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Edit, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  size: string;
  units_per_box: number;
  purchase_price_per_unit: number;
  selling_price_per_unit: number;
  selling_price_per_box: number;
  current_stock_units: number;
  minimum_stock_units: number;
  is_active: boolean;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
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

  const isLowStock = (product: Product) => {
    return product.current_stock_units <= product.minimum_stock_units;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Kelola Produk</h1>
              <p className="text-sm text-muted-foreground">Daftar produk dan stok</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className={isLowStock(product) ? "border-warning" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{product.size}</p>
                  </div>
                  {isLowStock(product) && (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Stok Rendah
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stok Saat Ini:</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {product.current_stock_units} botol ({Math.floor(product.current_stock_units / product.units_per_box)} dus)
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stok Minimum:</span>
                  <span className="font-medium">
                    {product.minimum_stock_units} botol ({Math.floor(product.minimum_stock_units / product.units_per_box)} dus)
                  </span>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Harga Jual/Botol:</span>
                    <span className="font-semibold text-primary">
                      Rp {product.selling_price_per_unit.toLocaleString("id-ID")}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Harga Jual/Dus:</span>
                    <span className="font-semibold text-primary">
                      Rp {product.selling_price_per_box.toLocaleString("id-ID")}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Isi per Dus:</span>
                    <span className="font-medium">{product.units_per_box} botol</span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Harga Beli/Botol:</span>
                    <span>Rp {product.purchase_price_per_unit.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Belum ada produk</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Products;
