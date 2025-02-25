
interface BusinessProfileProps {
  businessName: string;
  profileImage: string;
  bannerImage: string;
}

export const BusinessProfile = ({ businessName, profileImage, bannerImage }: BusinessProfileProps) => {
  return (
    <div className="text-center mb-8">
      {profileImage && (
        <div className={`relative inline-block ${bannerImage ? '-mt-16' : ''}`}>
          <img
            src={profileImage}
            alt={businessName}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
          />
        </div>
      )}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{businessName}</h1>
      <p className="text-gray-600 mt-2">Available Services</p>
    </div>
  );
};
