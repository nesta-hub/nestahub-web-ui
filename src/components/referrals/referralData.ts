import rewardBag from "@/assets/referrals/reward-bag.png";
import rewardShirt from "@/assets/referrals/reward-shirt.png";
import rewardBottle from "@/assets/referrals/reward-bottle.png";
import rewardThermalBottle from "@/assets/referrals/reward-thermal-bottle.png";
import rewardFan from "@/assets/referrals/reward-fan.png";
import rewardHoodie from "@/assets/referrals/reward-hoodie.png";
import rewardBucketHat from "@/assets/referrals/reward-bucket-hat.png";

export type Reward = {
  id: string;
  name: string;
  image: string;
  refsRequired: number;
  naira: number;
};

export const rewards: Reward[] = [
  { id: "tote", name: "Nestahub Tote Bag", image: rewardBag, refsRequired: 2, naira: 2000 },
  { id: "hat", name: "Bucket Hat", image: rewardBucketHat, refsRequired: 4, naira: 3500 },
  { id: "tee", name: "Classic Tee", image: rewardShirt, refsRequired: 6, naira: 3500 },
  { id: "fan", name: "Portable Fan", image: rewardFan, refsRequired: 8, naira: 6500 },
  { id: "thermal", name: "Thermal Bottle", image: rewardThermalBottle, refsRequired: 5, naira: 7000 },
  { id: "hoodie", name: "Premium Hoodie", image: rewardHoodie, refsRequired: 10, naira: 7500 },
  { id: "bottle", name: "Insulated Tumbler", image: rewardBottle, refsRequired: 3, naira: 11000 },
];

export const sampleMessages = [
  {
    id: "whatsapp",
    label: "WhatsApp DM",
    body: "Hey mama, there's a platfrom I think you should know about. It's called Nestahub, all your baby essentials at really low prices, delivered to your door, and you can even set up subscriptions for the things you always need. Check them out via this link nestahub.ng?ref=AMA123",
  },
  {
    id: "group",
    label: "Group Chat",
    body: "Mums, has anyone tried Nestahub for baby essentials? Low prices, home delivery, and subscriptions so you never run out of the things you always need. Genuinely useful. Check them out via this link nestahub.ng?ref=AMA123",
  },
];

export const faq = [
  {
    q: "Why am I sharing this, is it just for the points?",
    a: "The gifts are we saying thank you. Nestahub is something nursing mums genuinely find useful. Sharing your code means you're doing your friend a favour first.",
  },
  {
    q: "Do I need to be a Nestahub customer to share?",
    a: "No. Anyone can join the programme. If you're new, register below and we'll send you a personal code.",
  },
  {
    q: "When does a referral count?",
    a: "A referral is confirmed once your friend places her order and it is delivered. Cancelled or unpaid orders do not count.",
  },
  {
    q: "Do my points expire?",
    a: "Never. Your balance is cumulative and stays with you. Save up at your own pace and redeem the reward you actually want.",
  },
  {
    q: "Can I combine smaller rewards into a bigger one?",
    a: "Yes — every point stacks. Skip the small gifts and let referrals build toward whichever reward you're saving for.",
  },
  {
    q: "How do I check my balance?",
    a: "Tap 'Check my balance' at the top of this page and enter your referral code. We'll show your confirmed referrals.",
  },
  {
    q: "How are rewards delivered?",
    a: "Once you redeem, we deliver anywhere in Lagos.",
  },
];

export const steps = [
  { n: 1, title: "Get your code", body: "Register in under a minute. You'll receive a personal link and code to share however feels natural." },
  {
    n: 2,
    title: "Tell a mum",
    body: "Think of nursing mums in your circle. Send them a message. They'll thank you for it.",
  },
  { n: 3, title: "She discovers Nestahub", body: "She visits nestahub with your link or uses your code when she registers and places her first order." },
  { n: 4, title: "Your gifts add up", body: "Earn points on her first order and her next four — quietly, in the background." },
];
