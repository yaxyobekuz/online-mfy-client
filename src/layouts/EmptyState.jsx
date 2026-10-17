import Sidebar from "../components/Sidebar.jsx";

/**
 * Birorta MFY qo'shilmagan holat — chap panel ko'rinadi (undan MFY
 * qo'shiladi), asosiy qism bo'sh.
 *
 * Manzilda mahalla nomi yo'q, shuning uchun bo'limlar havolalari
 * ham chiqmaydi (`Sidebar` buni `mahallaSlug` yo'qligidan biladi).
 */
const EmptyState = ({ mahallas, onAccountChanged, onSwitchMahalla }) => (
  <div className="flex h-svh bg-canvas">
    <Sidebar
      mahallaName={null}
      active={null}
      mahallas={mahallas}
      onAccountChanged={onAccountChanged}
      onSwitchMahalla={onSwitchMahalla}
    />
    <main className="flex flex-1 items-center justify-center">
      <p className="text-muted">
        MFY qo&rsquo;shing — chap paneldagi ro&rsquo;yxatdan.
      </p>
    </main>
  </div>
);

export default EmptyState;
