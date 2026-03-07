import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Plus, X, Upload, Image, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
    customCategory: '',
    base_price: '',
    featured: false,
    images: [],
    variants: [],
    // Simple product fields (used if no variants)
    stock: '',
    sku: '',
    unit: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/categories`);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/${productId}`);
      const product = response.data;
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        customCategory: '',
        base_price: product.base_price,
        featured: product.featured,
        images: product.images || [],
        variants: product.variants || [],
        // If it's a simple product (1 variant named 'Standard' or similar)
        stock: product.variants?.length === 1 ? product.variants[0].stock : '',
        sku: product.variants?.length === 1 ? product.variants[0].sku : '',
        unit: product.variants?.length === 1 ? product.variants[0].name : ''
      });
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/admin/products');
    }
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    const category = formData.category === '__custom__' ? formData.customCategory : formData.category;
    if (!category || !category.trim()) newErrors.category = 'Category is required';
    
    if (!formData.base_price || parseFloat(formData.base_price) < 0) {
      newErrors.base_price = 'Valid base price is required';
    }

    // Validate variants
    formData.variants.forEach((variant, index) => {
      if (!variant.name || !variant.name.trim()) {
        newErrors[`variant_${index}_name`] = 'Variant name is required';
      }
      if (variant.price === '' || variant.price === undefined || parseFloat(variant.price) < 0) {
        newErrors[`variant_${index}_price`] = 'Price must be 0 or positive';
      }
      if (variant.stock === '' || variant.stock === undefined || parseInt(variant.stock) < 0) {
        newErrors[`variant_${index}_stock`] = 'Stock must be 0 or positive';
      }
      if (!variant.sku || !variant.sku.trim()) {
        newErrors[`variant_${index}_sku`] = 'SKU is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }
    
    setLoading(true);

    try {
      const category = formData.category === '__custom__' ? formData.customCategory : formData.category;
      
      const data = {
        name: formData.name,
        description: formData.description,
        category: category.trim(),
        base_price: parseFloat(formData.base_price),
        featured: formData.featured,
        images: formData.images.filter(img => img.trim() !== ''),
        variants: formData.variants.length > 0 
          ? formData.variants.map(v => ({
              ...v,
              price: parseFloat(v.price) || 0,
              stock: parseInt(v.stock) || 0
            }))
          : [{
              variant_id: `var_${Math.random().toString(36).substr(2, 8)}`,
              name: formData.unit || 'Standard',
              price: parseFloat(formData.base_price) || 0,
              stock: parseInt(formData.stock) || 0,
              sku: formData.sku || `${formData.name.substring(0,3).toUpperCase()}-STD`
            }]
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
      const errorMsg = error.response?.data?.detail || (isEdit ? 'Failed to update product' : 'Failed to create product');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    const newImages = [...formData.images];

    for (const file of files) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast.error(`${file.name}: Invalid file type. Only JPEG, PNG, WebP, GIF allowed.`);
        continue;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: File exceeds 10MB limit`);
        continue;
      }

      try {
        const fd = new FormData();
        fd.append('file', file);
        const response = await axios.post(`${API_URL}/api/upload/image`, fd, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        newImages.push(response.data.url);
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setFormData({ ...formData, images: newImages });
    setUploadingImages(false);
    // reset file input
    e.target.value = '';
  };

  const addImageUrl = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
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
    // Clear variant errors
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`variant_${index}_`)) delete newErrors[key];
    });
    setErrors(newErrors);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
    
    // Clear specific error on change
    const errorKey = `variant_${index}_${field}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
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
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  className={`border rounded-none p-4 ${errors.name ? 'border-red-500' : 'border-neutral-300'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="description" className="text-xs uppercase tracking-widest mb-2 block">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors({ ...errors, description: null });
                  }}
                  rows={4}
                  className={`border rounded-none p-4 ${errors.description ? 'border-red-500' : 'border-neutral-300'}`}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category" className="text-xs uppercase tracking-widest mb-2 block">Category *</Label>
                  <Select 
                    value={formData.category || undefined} 
                    onValueChange={(value) => {
                      setFormData({ ...formData, category: value, customCategory: '' });
                      if (errors.category) setErrors({ ...errors, category: null });
                    }}
                  >
                    <SelectTrigger className={`border rounded-none p-4 h-auto ${errors.category ? 'border-red-500' : 'border-neutral-300'}`}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">+ Add New Category</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.category === '__custom__' && (
                    <Input
                      placeholder="Enter new category name"
                      value={formData.customCategory}
                      onChange={(e) => {
                        setFormData({ ...formData, customCategory: e.target.value });
                        if (errors.category) setErrors({ ...errors, category: null });
                      }}
                      className="border border-neutral-300 rounded-none p-4 mt-2"
                    />
                  )}
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
                <div>
                  <Label htmlFor="base_price" className="text-xs uppercase tracking-widest mb-2 block">Base Price (₹) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.base_price}
                    onChange={(e) => {
                      setFormData({ ...formData, base_price: e.target.value });
                      if (errors.base_price) setErrors({ ...errors, base_price: null });
                    }}
                    className={`border rounded-none p-4 ${errors.base_price ? 'border-red-500' : 'border-neutral-300'}`}
                  />
                  {errors.base_price && <p className="text-red-500 text-xs mt-1">{errors.base_price}</p>}
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

              {/* Simple Stock - Only shown if no variants added */}
              {formData.variants.length === 0 && (
                <div className="pt-6 border-t border-neutral-100">
                  <h3 className="text-sm font-display mb-4 uppercase tracking-widest text-neutral-500">Simple Inventory (Optional)</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest mb-2 block">Total Stock</Label>
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="border-neutral-300 rounded-none p-4"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest mb-2 block">Unit (ml/g/pcs)</Label>
                      <Input
                        placeholder="e.g. 100ml"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className="border-neutral-300 rounded-none p-4"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest mb-2 block">SKU</Label>
                      <Input
                        placeholder="SKU-123"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="border-neutral-300 rounded-none p-4"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-2 italic">Fill this if you don't need multiple sizes/variations below.</p>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="border border-neutral-200 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display">Product Images</h2>
              <div className="flex gap-2">
                <label className="cursor-pointer bg-black text-white hover:bg-neutral-800 transition-colors px-4 py-2 text-xs flex items-center gap-2 uppercase tracking-widest">
                  <Upload className="w-4 h-4" />
                  {uploadingImages ? 'Uploading...' : 'Upload Images'}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                </label>
                <Button type="button" onClick={addImageUrl} className="bg-transparent border border-black text-black hover:bg-black hover:text-white rounded-none px-4 py-2 text-xs">
                  <Plus className="w-4 h-4 mr-2" />
                  Add URL
                </Button>
              </div>
            </div>

            {uploadingImages && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">Uploading images to cloud...</span>
              </div>
            )}

            {/* Image Preview Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  image && !image.startsWith('') ? (
                    <div key={index} className="relative group aspect-square border border-neutral-200">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full items-center justify-center bg-neutral-100 hidden">
                        <Image className="w-8 h-8 text-neutral-400" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : null
                ))}
              </div>
            )}

            {/* URL inputs for manually added URLs */}
            <div className="space-y-3">
              {formData.images.map((image, index) => (
                <div key={index} className="flex gap-3">
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={image}
                    onChange={(e) => updateImage(index, e.target.value)}
                    className="flex-1 border border-neutral-300 rounded-none p-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-3 border border-neutral-300 hover:bg-red-50 hover:border-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {formData.images.length === 0 && (
              <div className="border-2 border-dashed border-neutral-300 p-8 text-center">
                <Image className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p className="text-sm text-neutral-500 mb-2">No images added yet</p>
                <p className="text-xs text-neutral-400">Upload images or paste URLs to add product photos</p>
              </div>
            )}
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="col-span-1 md:col-span-1">
                      <Label className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1 block">Size / Unit</Label>
                      <Input
                        placeholder="e.g. 50ml or 100g"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        className={`border rounded-none p-3 text-sm ${errors[`variant_${index}_name`] ? 'border-red-500' : 'border-neutral-300'}`}
                      />
                      {errors[`variant_${index}_name`] && (
                        <p className="text-red-500 text-[10px] mt-1">{errors[`variant_${index}_name`]}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1 block">Price (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        className={`border rounded-none p-3 text-sm ${errors[`variant_${index}_price`] ? 'border-red-500' : 'border-neutral-300'}`}
                      />
                      {errors[`variant_${index}_price`] && (
                        <p className="text-red-500 text-[10px] mt-1">{errors[`variant_${index}_price`]}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1 block">Stock</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Quantity"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        className={`border rounded-none p-3 text-sm ${errors[`variant_${index}_stock`] ? 'border-red-500' : 'border-neutral-300'}`}
                      />
                      {errors[`variant_${index}_stock`] && (
                        <p className="text-red-500 text-[10px] mt-1">{errors[`variant_${index}_stock`]}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1 block">SKU</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="SKU"
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                          className={`flex-1 border rounded-none p-3 text-sm ${errors[`variant_${index}_sku`] ? 'border-red-500' : 'border-neutral-300'}`}
                        />
                        <button
                          type="button"
                          onClick={() => updateVariant(index, 'sku', `${formData.name.substring(0,3).toUpperCase()}-${variant.name.toUpperCase()}-${Math.floor(Math.random() * 1000)}`)}
                          className="px-2 border border-neutral-300 hover:bg-neutral-100 text-[10px] uppercase"
                          title="Generate SKU"
                        >
                          Gen
                        </button>
                      </div>
                      {errors[`variant_${index}_sku`] && (
                        <p className="text-red-500 text-[10px] mt-1">{errors[`variant_${index}_sku`]}</p>
                      )}
                    </div>
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