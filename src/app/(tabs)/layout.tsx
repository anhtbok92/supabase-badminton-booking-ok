import BottomNavBar from '@/components/bottom-nav';
import FloatingContact from '@/components/floating-contact';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow pb-16">{children}</main>
      <FloatingContact />
      <BottomNavBar />
    </div>
  );
}
