export interface ICreateProperty {
  title: string;
  description: string;
  images?: string[];
  price: number;
  location: string;
  categoryId: string;
  bedrooms: number;
  bathrooms: number;
  size?: number;
  amenities?: string[];
  availability?: "AVAILABLE" | "RENTED" | "UNAVAILABLE";
}