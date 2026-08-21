import React from 'react';

interface DepartmentProps {
  name: string;
  address: string;
  phone: string;
  website: string;
  coordinates: { lat: number; lng: number };
}

export const DepartmentCard: React.FC<DepartmentProps> = ({
  name,
  address,
  phone,
  website,
  coordinates,
}) => {
  const mapUrl = `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15&output=embed`;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3 hover:shadow-md transition-shadow">
      <h4 className="font-semibold text-lg text-gray-900">{name}</h4>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-600 flex items-start gap-2">
          <span className="text-lg">📍</span>
          <span>{address}</span>
        </p>
        
        <p className="text-sm text-gray-600 flex items-center gap-2">
          <span className="text-lg">📞</span>
          <a href={`tel:${phone}`} className="hover:text-blue-600">
            {phone}
          </a>
        </p>
        
        <a
          href={website}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-2"
        >
          <span className="text-lg">🌐</span>
          Official Portal
        </a>
      </div>

      <div className="w-full h-40 rounded overflow-hidden border border-gray-200">
        <iframe
          title={name}
          src={mapUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen={false}
          aria-label={`Map showing ${name} location`}
        />
      </div>
    </div>
  );
};
