import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Droplets,
  Leaf,
  Package,
  TrendingUp,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Truck,
} from "lucide-react";

interface PublicStats {
  totalProducts: number;
  totalSales: number;
  totalStock: number;
}

const PublicHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats>({
    totalProducts: 0,
    totalSales: 0,
    totalStock: 0,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    try {
      // Get products
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      // Get sales count
      const { count: salesCount } = await supabase
        .from("sales_transactions")
        .select("*", { count: "exact", head: true });

      const totalStock = productsData?.reduce((sum, p) => sum + p.current_stock_units, 0) || 0;

      setProducts(productsData || []);
      setStats({
        totalProducts: productsData?.length || 0,
        totalSales: salesCount || 0,
        totalStock,
      });
    } catch (error) {
      console.error("Error loading public data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Droplets className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Toriyu Water</h1>
              <p className="text-xs text-muted-foreground">Air Minum Berkualitas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>
              Produk
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>
              Tentang
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Kontak
            </Button>
            <Button size="sm" onClick={() => navigate("/auth")}>
              Login Admin
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1920&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Leaf className="h-4 w-4" />
              <span className="text-sm font-medium">Segar dari Alam</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Air Minum <span className="text-primary">Berkualitas</span> untuk Keluarga Anda
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Nikmati kesegaran air minum pilihan yang diproses dengan teknologi modern. 
              Tersedia dalam berbagai ukuran untuk memenuhi kebutuhan keluarga Anda.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gap-2" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>
                Lihat Produk
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                <Phone className="h-4 w-4" />
                Hubungi Kami
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border">
              <div>
                <div className="text-3xl font-bold text-primary">{stats.totalProducts}+</div>
                <p className="text-sm text-muted-foreground">Varian Produk</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{stats.totalSales.toLocaleString()}+</div>
                <p className="text-sm text-muted-foreground">Transaksi Sukses</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">{Math.floor(stats.totalStock / 12)}+</div>
                <p className="text-sm text-muted-foreground">Dus Tersedia</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Element */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Mengapa Memilih Kami?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Kami berkomitmen memberikan produk air minum terbaik dengan pelayanan prima
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none bg-card shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Kualitas Terjamin</h3>
                <p className="text-muted-foreground">
                  Air minum kami diproses dengan standar ketat dan aman untuk dikonsumsi
                </p>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Pengiriman Cepat</h3>
                <p className="text-muted-foreground">
                  Layanan antar langsung ke rumah Anda dengan pengiriman yang cepat
                </p>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Harga Terjangkau</h3>
                <p className="text-muted-foreground">
                  Nikmati kualitas premium dengan harga yang ramah di kantong
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Produk Kami</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Pilihan Air Minum Terbaik</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tersedia dalam berbagai ukuran untuk memenuhi kebutuhan Anda
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground mt-4">Memuat produk...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border">
                  <div 
                    className="h-48 bg-cover bg-center relative"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80')`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                        {product.size}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">Ukuran: {product.size}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Harga Per Botol</span>
                        <span className="font-semibold text-primary">
                          Rp {Number(product.selling_price_per_unit).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Harga Per Dus</span>
                        <span className="font-semibold text-primary">
                          Rp {Number(product.selling_price_per_box).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-sm text-muted-foreground">Stok Tersedia</span>
                        <span className={`font-semibold ${product.current_stock_units <= product.minimum_stock_units ? 'text-warning' : 'text-success'}`}>
                          {product.current_stock_units} botol ({Math.floor(product.current_stock_units / product.units_per_box)} dus)
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada produk tersedia</p>
            </div>
          )}
        </div>
      </section>

      {/* About Section with Image */}
      <section id="about" className="py-20 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=1920&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Leaf className="h-4 w-4" />
                <span className="text-sm font-medium">Tentang Kami</span>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Menyediakan Air Minum <span className="text-primary">Segar & Berkualitas</span>
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Toriyu Water adalah penyedia air minum berkualitas yang berkomitmen untuk 
                memberikan produk terbaik bagi masyarakat. Dengan pengalaman bertahun-tahun, 
                kami terus berinovasi dalam menghadirkan air minum yang segar dan higienis.
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Setiap tetes air yang kami produksi melewati proses penyaringan multi-tahap 
                untuk memastikan kemurnian dan kualitas terbaik sampai ke tangan Anda.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats.totalSales}+</div>
                    <p className="text-sm text-muted-foreground">Pelanggan Puas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
                    <p className="text-sm text-muted-foreground">Varian Produk</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80" 
                  alt="Fresh plants representing purity"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-2xl shadow-xl">
                <div className="text-3xl font-bold">100%</div>
                <p className="text-sm opacity-90">Kualitas Terjamin</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Phone className="h-4 w-4" />
              <span className="text-sm font-medium">Hubungi Kami</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Kami Siap Melayani Anda</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hubungi kami untuk pemesanan atau informasi lebih lanjut
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-none bg-card shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Telepon</h3>
                <p className="text-muted-foreground">+62 812-3456-7890</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Alamat</h3>
                <p className="text-muted-foreground">Desa Toriyu, Kec. Hijau</p>
              </CardContent>
            </Card>

            <Card className="border-none bg-card shadow-lg text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Jam Operasional</h3>
                <p className="text-muted-foreground">Setiap Hari: 08:00 - 17:00</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Droplets className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold">Toriyu Water</h3>
                <p className="text-sm opacity-70">Air Minum Berkualitas</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm opacity-70">
                © {new Date().getFullYear()} Toriyu Water. Semua hak dilindungi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-background hover:text-primary hover:bg-background/10"
                onClick={() => navigate("/auth")}
              >
                Login Admin
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicHome;
