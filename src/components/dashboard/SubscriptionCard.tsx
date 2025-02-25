
import { Button } from "@/components/ui/button";

export const SubscriptionCard = () => {
  return (
    <div className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange p-6 rounded-xl text-white mb-8">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2">Subscribe now at $1</h3>
          <p className="text-white/90 mb-4">
            Kickstart a strong 2025 with our Premium Plan - Now just $1 (originally $19)
          </p>
          <Button variant="secondary" className="bg-white text-gebeya-pink hover:bg-white/90">
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
};
