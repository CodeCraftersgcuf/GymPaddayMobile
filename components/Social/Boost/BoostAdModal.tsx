import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { images } from '@/constants';

interface BenefitItem {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap | keyof typeof Ionicons.glyphMap;
  iconFamily: 'MaterialIcons' | 'Ionicons';
}

const benefits: BenefitItem[] = [
  {
    id: 1,
    title: 'Increased Visibility',
    description: 'Boosting your ad helps it reach a larger audience beyond your existing followers, increasing the chances of being seen by potential customers.',
    icon: 'visibility',
    iconFamily: 'MaterialIcons',
  },
  {
    id: 2,
    title: 'Targeted Reach',
    description: 'You can choose specific demographics, locations, ensuring your ad is seen by the people most likely to engage with it.',
    icon: 'target',
    iconFamily: 'MaterialIcons',
  },
  {
    id: 3,
    title: 'More Engagement',
    description: 'Boosted ads tend to get more likes, comments, shares, and clicks, helping you build credibility and foster a more active community.',
    icon: 'heart',
    iconFamily: 'Ionicons',
  },
  {
    id: 4,
    title: 'Wider Reach',
    description: 'Boosted ads will not only be featured on gym paddy but also outside gym paddy to get more visibility and reach',
    icon: 'public',
    iconFamily: 'MaterialIcons',
  },
  {
    id: 5,
    title: 'Budget Control',
    description: 'You can set your own budget and duration, making it easy to manage costs while still achieving measurable marketing results.',
    icon: 'wallet',
    iconFamily: 'Ionicons',
  },
];

interface BoostAdModalProps {
  visible: boolean;
  onClose: () => void;
  dark: boolean;
  post_id: any; // Assuming post_id is passed as a prop
}

const BoostAdModal: React.FC<BoostAdModalProps> = ({ visible, onClose, dark , post_id}) => {
  console.log("BoostAdModal post_id:", post_id);
  const styles = createStyles(dark);
  const route = useRouter();
  const onProceed = () => {
    route.push({pathname :'/BoostPostScreen_audience',params: {
      post_id: post_id, // Replace with actual post_id from props, state, or context
    }});
  };  

  const renderIcon = (benefit: BenefitItem) => {
    const IconComponent = benefit.iconFamily === 'MaterialIcons' ? MaterialIcons : Ionicons;
    return <IconComponent name={benefit.icon as any} size={20} color="#ffffff" />;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          {/* Header with Close Button */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Boost Ad</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={24} color={dark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Hero Image */}
            <View style={styles.heroContainer}>
              <Image
                source={images.boostImage}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>

            {/* Main Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.mainTitle}>Get Amazing Benefits from Boosting</Text>
            </View>

            {/* Benefits List */}
            <View style={styles.benefitsContainer}>
              {benefits.map((benefit) => (
                <View key={benefit.id} style={styles.benefitItem}>
                  <View style={styles.benefitIconContainer}>
                    <Text style={styles.benefitNumber}>{benefit.id}</Text>
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Proceed Button */}
            <TouchableOpacity 
              style={styles.proceedButton} 
              activeOpacity={0.8}
              onPress={onProceed}
            >
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (dark: boolean) => {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      backgroundColor: dark ? '#000000' : '#ffffff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: '90%',
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: dark ? '#333333' : '#e5e5e5',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: dark ? '#ffffff' : '#000000',
    },
    closeButton: {
      padding: 4,
    },
    heroContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    heroImage: {
      width: '100%',
      height: 180,
      borderRadius: 12,
    },
    titleContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    mainTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FF0000',
      textAlign: 'left',
    },
    benefitsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    benefitItem: {
      flexDirection: 'row',
      marginBottom: 24,
      alignItems: 'flex-start',
    },
    benefitIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FF0000',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      marginTop: 2,
    },
    benefitNumber: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    benefitContent: {
      flex: 1,
    },
    benefitTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: dark ? '#ffffff' : '#000000',
      marginBottom: 6,
    },
    benefitDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: dark ? '#cccccc' : '#666666',
    },
    proceedButton: {
      backgroundColor: '#FF0000',
      marginHorizontal: 20,
      marginVertical: 30,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    proceedButtonText: {
      color: '#ffffff',
      fontSize: 18,
      fontWeight: '600',
    },
  });
};

export default BoostAdModal;