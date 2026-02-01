QA Issue Map (Android)

1. Sign up validation missing (name/age/phone) -> app/register.tsx, constants/validation.ts
2. Register field stays red after valid -> components/login/FloatingLabelInput.tsx
3. Terms/privacy not clickable -> app/register.tsx, app/login.tsx, app/resetpassword.tsx
4. Login button unusable in split screen -> app/login.tsx
5. Country code missing -> app/register.tsx (phone placeholder/validation)
6. OTP typing after delete -> app/verify-otp.tsx
7. OTP box red only on error -> app/verify-otp.tsx
8. Profile picture required validation -> app/register.tsx
9. Keyboard minimizes when moving fields -> app/register.tsx (ScrollView keyboardShouldPersistTaps)
10. OTP email title (Laravel) -> backend email template
11. Username taken error -> backend validation mapping in utils/showApiErrorToast.ts
12. Reset password mismatch -> app/resetpassword.tsx, constants/validation.ts
13. Reset password submit no action -> app/resetpassword.tsx
14. Media viewer back button -> app/MediaViewer.tsx
15. Hide post button persists -> app/(tabs)/index.tsx
16. Hidden post returns after reopen -> app/(tabs)/index.tsx (persist hidden ids)
17. Search clear (X) -> app/search.tsx
18. Search results blank -> app/search.tsx
19. Search blocks lower app -> app/search.tsx (padding + layout)
20. Copy profile URL -> app/UserProfile.tsx
21. Share profile -> app/UserProfile.tsx
22. Top up dummy account number -> app/topup.tsx, app/deposit.tsx, app/(tabs)/more.tsx (needs backend)
23. Market price mismatch -> app/(tabs)/market.tsx, app/marketView.tsx, constants/marketData.ts
24. Market filter by state -> app/(tabs)/market.tsx, app/marketView.tsx
25. Comments back closes app -> components/Social/CommentsBottomSheet.tsx
26. Delete comment not working -> components/Social/CommentItem.tsx, components/Social/CommentsBottomSheet.tsx
27. Live label says Live now -> components/LiveCard.tsx, components/LiveStreamFeed.tsx
29. Social video play/pause overlay -> components/Social/PostItem.tsx
30. New post error messaging -> app/createpost.tsx
32. Post text editable after share -> app/createpost.tsx, components/Social/createpost/UserSection.tsx
33. New post upload error -> utils/mutations/posts.ts, app/createpost.tsx
34. Story music genre clipped -> app/AddToStoryScreen.tsx
35. Go live despite requirements -> app/goLive.tsx
36. Message status always online -> components/messages/, app/messageChat.tsx
37. Post count mismatch in chat -> components/messages/, app/messageChat.tsx
38. Multi-select media -> app/createpost.tsx
More business upgrade no change -> app/bussinessRegister.tsx, app/bussinessForm.tsx
Live chat overlaps mute -> app/userLiveViewMain.tsx
Story add music fails -> app/AddToStoryScreen.tsx, constants/storyMusic.ts
Story search box shifts -> app/AddToStoryScreen.tsx
Story duration line missing -> app/UserStoryPreview.tsx
Market listings disappear -> app/(tabs)/market.tsx
Market delete post visible -> app/marketProfile.tsx
Story reselects last image -> app/AddToStoryScreen.tsx
UI gaps vs Figma -> app/OnboardingScreen.tsx, app/(tabs)/live.tsx, app/notification.tsx, app/LiveStreamDiscoverScreen.tsx, app/BoostPostScreen.tsx, app/marketBoard.tsx, app/UserListing.tsx, components/messages/CallSummary.tsx
