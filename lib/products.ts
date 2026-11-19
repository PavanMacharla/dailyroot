export type Product = { id: string; name: string; category: string; price: number; unit: string; image: string; badge?: string };

export const products: Product[] = [
 {id:'tomato',name:'Farm Fresh Tomatoes',category:'Vegetables',price:32,unit:'500 g',image:'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=700',badge:'Bestseller'},
 {id:'banana',name:'Yelakki Bananas',category:'Fruits',price:58,unit:'6 pcs',image:'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=700'},
 {id:'spinach',name:'Fresh Spinach',category:'Vegetables',price:25,unit:'1 bunch',image:'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700'},
 {id:'milk',name:'Farm Cow Milk',category:'Dairy',price:34,unit:'500 ml',image:'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=700'},
 {id:'avocado',name:'Creamy Avocado',category:'Fruits',price:89,unit:'2 pcs',image:'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=700',badge:'Seasonal'},
 {id:'carrot',name:'Sweet Ooty Carrots',category:'Vegetables',price:45,unit:'500 g',image:'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=700'},
 {id:'bread',name:'Whole Wheat Bread',category:'Bakery',price:48,unit:'400 g',image:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=700'},
 {id:'eggs',name:'Country Eggs',category:'Dairy',price:78,unit:'6 pcs',image:'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=700'}
];

export async function fetchProducts(supabase: any): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, price, unit, image_url, badge, is_active')
    .eq('is_active', true);

  if (error) return products;

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    unit: row.unit,
    image: row.image_url,
    badge: row.badge
  }));
}
