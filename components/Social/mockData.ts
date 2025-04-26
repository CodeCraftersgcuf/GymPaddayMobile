import { dummyImage } from "@/constants/help";

export interface StoryData {
    id: number;
    username: string;
    profileImage: string;
    hasStory: boolean;
    viewedStory: boolean;
    isLive: boolean;
  }
  
  export interface PostData {
    id: number;
    user: {
      id: number;
      username: string;
      profile_picture: string;
    };
    content: string;
    imagesUrl: string[];
    timestamp: string;
    likes_count: number;
    comments_count: number;
    view_count: number;
    share_count: number;
    recent_comments: any[];
  }
  
  export const mockStories: StoryData[] = [
    {
      id: 1,
      username: 'Adam',
      profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      hasStory: true,
      viewedStory: false,
      isLive: true,
    },
    {
      id: 2,
      username: 'Cassandra',
      profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      hasStory: true,
      viewedStory: false,
      isLive: false,
    },
    {
      id: 3,
      username: 'Halima',
      profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      hasStory: true,
      viewedStory: true,
      isLive: false,
    },
    {
      id: 4,
      username: 'Michael',
      profileImage: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
      hasStory: true,
      viewedStory: false,
      isLive: false,
    },
    {
      id: 5,
      username: 'Sophia',
      profileImage: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      hasStory: true,
      viewedStory: false,
      isLive: true,
    },
    {
      id: 6,
      username: 'Carlos',
      profileImage: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
      hasStory: true,
      viewedStory: true,
      isLive: false,
    },
  ];
  
  export const mockPosts: PostData[] = [
    {
      id: 1,
      user: {
        id: 1,
        username: 'Maleekfrenzy',
        profile_picture: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg',
      },
      content: 'Always try to the best you can be, strive for the best, put in the work and you will achieve your goals',
      imagesUrl: [
        'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      ],
      timestamp: '20 min ago',
      likes_count: 500,
      comments_count: 26,
      view_count: 1245,
      share_count: 26,
      recent_comments: [
        {
          id: 1,
          user: {
            username: 'Sarah',
            profile_picture: 'https://images.pexels.com/photos/1987301/pexels-photo-1987301.jpeg',
          },
          text: 'This is absolutely inspiring!',
        },
        {
          id: 2,
          user: {
            username: 'John',
            profile_picture: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
          },
          text: 'Great motivation, needed this today.',
        }
      ],
    },
    {
      id: 2,
      user: {
        id: 2,
        username: 'Alex',
        profile_picture: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      },
      content: 'Just finished my workout at the new gym! Feeling strong 💪',
      imagesUrl: [
        'https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg',
        'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg',
        'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg',
      ],
      timestamp: '45 min ago',
      likes_count: 324,
      comments_count: 42,
      view_count: 893,
      share_count: 15,
      recent_comments: [
        {
          id: 3,
          user: {
            username: 'Mike',
            profile_picture: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
          },
          text: 'Looking strong, man! Which gym is this?',
        },
        {
          id: 4,
          user: {
            username: 'Emma',
            profile_picture: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          },
          text: 'Impressive progress! Keep it up!',
        },
        {
          id: 4,
          user: {
            username: 'Mike',
            profile_picture: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
          },
          text: 'Looking strong, man! Which gym is this?',
        },
        {
          id: 5,
          user: {
            username: 'Emma',
            profile_picture: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          },
          text: 'Impressive progress! Keep it up!',
        },
        {
          id: 31,
          user: {
            username: 'Mike',
            profile_picture: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
          },
          text: 'Looking strong, man! Which gym is this?',
        },
        {
          id: 14,
          user: {
            username: 'Emma',
            profile_picture: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          },
          text: 'Impressive progress! Keep it up!',
        },
        {
          id: 41,
          user: {
            username: 'Mike',
            profile_picture: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
          },
          text: 'Looking strong, man! Which gym is this?',
        },
        {
          id: 51,
          user: {
            username: 'Emma',
            profile_picture: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          },
          text: 'Impressive progress! Keep it up!',
        },
      ],
    },
    {
      id: 3,
      user: {
        id: 3,
        username: 'Sophia',
        profile_picture: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      },
      content: 'My healthy meal prep for the week! Staying on track with nutrition is key to fitness success.',
      imagesUrl: [
        'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
        'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        'https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg',
        'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg',
        'https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg',
      ],
      timestamp: '2 hours ago',
      likes_count: 412,
      comments_count: 38,
      view_count: 1024,
      share_count: 27,
      recent_comments:[
        {
          id: 5,
          user: {
            username: 'David',
            profile_picture: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
          },
          text: 'This looks delicious and healthy!',
          timestamp: '2h ago',
          likes: 12,
          replies: [
            {
              id: 51,
              user: {
                username: 'Sarah',
                profile_picture: dummyImage(),
              },
              text: 'Totally agree! The presentation is amazing too 😍',
              timestamp: '1h ago',
              likes: 3,
            },
            {
              id: 52,
              user: {
                username: 'Mike',
                profile_picture: dummyImage(),
              },
              text: 'And it fits perfectly into my diet plan!',
              timestamp: '30m ago',
              likes: 2,
            }
          ]
        },
        {
          id: 6,
          user: {
            username: 'Priya',
            profile_picture: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
          },
          text: 'Can you share your recipes? I need to up my meal prep game.',
          timestamp: '1h ago',
          likes: 8,
          replies: [
            {
              id: 61,
              user: {
                username: 'Chef Alex',
                profile_picture: dummyImage(),
              },
              text: 'I can help you with some great meal prep recipes! Check out my profile for weekly meal plans.',
              timestamp: '45m ago',
              likes: 5,
            }
          ]
        }
      ],
    },
  ];