import NflProvider from "./features/nfl/context/NflProvider";
import HomePage from "./pages/home/HomePage";

export default function App() {
  return (
    <NflProvider>
      <HomePage />
    </NflProvider>
  );
}
