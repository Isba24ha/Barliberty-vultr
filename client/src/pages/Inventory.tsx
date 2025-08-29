import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  Image as ImageIcon,
  Search,
  Filter
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/currency";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product, Category } from "@shared/schema";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    categoryId: "",
    price: "",
    stock: "",
    minStock: "",
    maxStock: "",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });
  const { toast } = useToast();

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    refetchInterval: 5000,
    staleTime: 0, // Data is always stale, always refetch
    cacheTime: 0, // Don't cache data
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 0,
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return apiRequest("POST", "/api/products", productData);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Produit créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
      handleCloseModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du produit",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
      handleCloseModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du produit",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du produit",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return apiRequest("POST", "/api/categories", categoryData);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Catégorie créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.refetchQueries({ queryKey: ["/api/categories"] });
      handleCloseCategoryModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la catégorie",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/categories/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Catégorie mise à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.refetchQueries({ queryKey: ["/api/categories"] });
      handleCloseCategoryModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de la catégorie",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(product => 
    product.stock !== null && product.minStock !== null && product.stock <= product.minStock
  );

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setNewProduct({
      name: "",
      description: "",
      categoryId: "",
      price: "",
      stock: "",
      minStock: "",
      maxStock: "",
    });
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setNewCategory({
      name: "",
      description: "",
    });
  };

  const handleSubmit = () => {
    if (!newProduct.name || !newProduct.categoryId || !newProduct.price) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: newProduct.name,
      description: newProduct.description || "",
      categoryId: parseInt(newProduct.categoryId),
      price: newProduct.price, // Garder comme chaîne pour le schéma decimal
      stockQuantity: parseInt(newProduct.stock || "0"),
      minStockLevel: parseInt(newProduct.minStock || "0"),
      imageUrl: null, // Pour l'instant, pas de support d'image
      isActive: true
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId.toString(),
      price: product.price,
      stock: product.stock?.toString() || "",
      minStock: product.minStock?.toString() || "",
      maxStock: product.maxStock?.toString() || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleSubmitCategory = () => {
    if (!newCategory.name) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom pour la catégorie",
        variant: "destructive",
      });
      return;
    }

    const categoryData = {
      name: newCategory.name,
      description: newCategory.description || "",
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryData });
    } else {
      createCategoryMutation.mutate(categoryData);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || "",
    });
    setShowCategoryModal(true);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === null) return { status: "unknown", color: "bg-gray-500" };
    if (product.minStock !== null && product.stock <= product.minStock) return { status: "low", color: "bg-red-500" };
    if (product.maxStock !== null && product.stock >= product.maxStock * 0.8) return { status: "high", color: "bg-green-500" };
    return { status: "medium", color: "bg-orange-500" };
  };

  if (productsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion du Stock</h1>
          <p className="text-gray-400 mt-1">Gérez vos produits et surveillez votre inventaire</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Produit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Modifier le produit" : "Nouveau produit"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct({...newProduct, categoryId: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="bg-gray-700 border-gray-600"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Prix *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock actuel</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minStock">Stock minimum</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="maxStock">Stock maximum</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={newProduct.maxStock}
                    onChange={(e) => setNewProduct({...newProduct, maxStock: e.target.value})}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>



              <div className="flex space-x-3">
                <Button
                  onClick={handleCloseModal}
                  variant="outline"
                  className="flex-1 border-gray-600 hover:bg-gray-700"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {editingProduct ? "Modifier" : "Créer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Produits</p>
                <p className="text-2xl font-bold text-white">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Stock Faible</p>
                <p className="text-2xl font-bold text-red-400">{lowStockProducts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Catégories</p>
                <p className="text-2xl font-bold text-green-400">{categories.length}</p>
              </div>
              <Filter className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Valeur Stock</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(
                    products.reduce((sum, p) => sum + (parseFloat(p.price) * (p.stock || 0)), 0).toFixed(2)
                  )}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => setShowCategoryModal(true)}
          variant="outline"
          className="border-gray-600 hover:bg-gray-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Catégorie
        </Button>
      </div>

      {/* Categories Management */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Gestion des Catégories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-400 mt-1">{category.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditCategory(category)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product);
          const category = categories.find(c => c.id === product.categoryId);
          
          return (
            <Card key={product.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${stockStatus.color}`}></div>
                    <Badge variant="secondary" className="text-xs">
                      {category?.name}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(product)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(product.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-white">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-400">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-sm text-gray-400">
                      Stock: {product.stock || 0}
                    </span>
                  </div>
                  {product.minStock !== null && product.stock !== null && product.stock <= product.minStock && (
                    <div className="flex items-center space-x-1 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs">Stock faible</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Aucun produit trouvé</p>
        </div>
      )}

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Nom de la catégorie *</Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="bg-gray-700 border-gray-600"
                placeholder="Ex: Boissons, Entrées, Plats..."
              />
            </div>
            <div>
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                className="bg-gray-700 border-gray-600"
                placeholder="Description de la catégorie (optionnel)"
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleCloseCategoryModal}
                variant="outline"
                className="flex-1 border-gray-600 hover:bg-gray-700"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitCategory}
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {editingCategory ? "Modifier" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}