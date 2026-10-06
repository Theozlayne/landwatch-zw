type ReverseGeocodeResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    locality?: string;
    suburb?: string;
    city_district?: string;
  };
};

export async function resolveCityName(latitude: number, longitude: number): Promise<string | null> {
  try {
    const query = new URLSearchParams({ format: 'jsonv2', zoom: '18', addressdetails: '1', lat: String(latitude), lon: String(longitude) });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const result = await response.json() as ReverseGeocodeResponse;
    const address = result.address;
    // Prefer a settlement/locality. District and province names are deliberately
    // excluded because they can be returned for a city, e.g. Makonde for Chinhoyi.
    return address?.city || address?.town || address?.village || address?.municipality || address?.locality || address?.suburb || address?.city_district || null;
  } catch {
    return null;
  }
}
