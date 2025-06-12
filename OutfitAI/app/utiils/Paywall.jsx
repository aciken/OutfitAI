import RevenueCatUI from 'react-native-purchases-ui';
import { useRouter } from 'expo-router';
import { useGlobalContext } from '../context/GlobalProvider';
import Purchases from 'react-native-purchases';

export default function Paywall() {
  const router = useRouter();
  const { setIsPro } = useGlobalContext();

  const handlePurchaseCompleted = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const isPro = customerInfo?.entitlements?.all?.Pro?.isActive ?? false;
      setIsPro(isPro);
      router.back();
    } catch (error) {
      console.error('Error handling purchase completion:', error);
    }
  };

  const handleRestoreCompleted = async (info) => {
    try {
      const isPro = info?.customerInfo?.entitlements?.all?.Pro?.isActive ?? false;
      console.log(info, isPro);
      if (isPro) {
        setIsPro(true);
        router.back();
      }
    } catch (error) {
      console.error('Error handling restore completion:', error);
    }
  };

  const handleCloseButton = () => {
    router.back();
  }

  return (
    <RevenueCatUI.Paywall 
      onPurchaseCompleted={handlePurchaseCompleted}
      onRestoreCompleted={handleRestoreCompleted}
      onDismiss={handleCloseButton}
    />
  );
}