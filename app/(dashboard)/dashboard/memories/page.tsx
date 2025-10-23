import MemoriesPanel from "@/components/dashboard/MemoriesPanel";

export const metadata = {
  title: "Memories",
  openGraph: {
    images: "/metadata-img.png",
  },
  twitter: {
    images: "/metadata-img.png",
  },
};

export default function Page() {
  return <MemoriesPanel />;
}
