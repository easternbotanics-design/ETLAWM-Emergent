import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminProductForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!productId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: '',
    featured: false,
    images: [''],
    variants: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/${productId}`);
      const product = response.data;
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        base_price: product.base_price,
        featured: product.featured,
        images: product.images.length > 0 ? product.images : [''],
        variants: product.variants || []
      });
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/admin/products');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        base_price: parseFloat(formData.base_price),
        images: formData.images.filter(img => img.trim() !== '')
      };

      if (isEdit) {
        await axios.put(`${API_URL}/api/products/${productId}`, data, {
          withCredentials: true
        });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API_URL}/api/products`, data, {
          withCredentials: true
        });
        toast.success('Product created successfully');
      }
      navigate('/admin/products');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update product' : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages.length > 0 ? newImages : [''] });
  };

  const updateImage = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: '', price: '', stock: '', sku: '' }]
    });
  };

  const removeVariant = (index) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index)
    });
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="font-display text-5xl mb-2">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-neutral-600">Fill in the product details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="border border-neutral-200 p-8">
            <h2 className="text-xl font-display mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-xs uppercase tracking-widest mb-2 block">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border border-neutral-300 rounded-none p-4"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-xs uppercase tracking-widest mb-2 block">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="border border-neutral-300 rounded-none p-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category" className="text-xs uppercase tracking-widest mb-2 block">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="border border-neutral-300 rounded-none p-4"
                  />
                </div>
                <div>
                  <Label htmlFor="base_price" className="text-xs uppercase tracking-widest mb-2 block">Base Price *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    required
                    className="border border-neutral-300 rounded-none p-4"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-5 h-5"
                />
                <Label htmlFor="featured" className="text-sm">Feature this product on homepage</Label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="border border-neutral-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display">Product Images</h2>
              <Button type="button" onClick={addImage} className="bg-transparent border border-black text-black hover:bg-black hover:text-white rounded-none px-4 py-2 text-xs">
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </div>
            <div className="space-y-4">
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-4">
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={image}
                    onChange={(e) => updateImage(index, e.target.value)}
                    className="flex-1 border border-neutral-300 rounded-none p-4"
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-4 border border-neutral-300 hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="border border-neutral-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display">Product Variants</h2>
              <Button type="button" onClick={addVariant} className="bg-transparent border border-black text-black hover:bg-black hover:text-white rounded-none px-4 py-2 text-xs">
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
              </Button>
            </div>
            <div className="space-y-6">
              {formData.variants.map((variant, index) => (
                <div key={index} className="border border-neutral-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-medium">Variant {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Name (e.g., 50ml)"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      className="border border-neutral-300 rounded-none p-4"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', e.target.value)}
                      className="border border-neutral-300 rounded-none p-4"
                    />
                    <Input
                      type="number"
                      placeholder="Stock"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                      className="border border-neutral-300 rounded-none p-4"
                    />
                    <Input
                      placeholder="SKU"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      className="border border-neutral-300 rounded-none p-4"
                    />
                  </div>
                </div>
              ))}
              {formData.variants.length === 0 && (
                <p className="text-sm text-neutral-600 text-center py-8">No variants added. Add variants for different sizes or options.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent transition-all duration-300 rounded-none px-8 py-6 uppercase tracking-widest text-xs"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </Button>
            <Button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="flex-1 bg-transparent border border-black text-black hover:bg-black hover:text-white rounded-none px-8 py-6 uppercase tracking-widest text-xs"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductForm;