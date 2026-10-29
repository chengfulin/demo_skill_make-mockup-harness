/**
 * S3 地點區塊（Prototype `.sec` ＞ h4「地點」）：
 * 可定位 → 按鈕「<location> · 在地圖上看」（點擊交由容器：關面板、切地圖、高亮，AC-P21）；
 * 不可定位（`place` 為 null）→ 徽章「<location>（無法在示意地圖上定位）」，不可點（AC-S27）。
 */
export interface EventPlaceProps {
  /** 地點顯示字（`StoryEvent.location`） */
  location: string;
  /** 地點 id；無法在示意地圖定位為 null */
  place: string | null;
  /** 點「在地圖上看」 */
  onGoToPlace?: (placeId: string) => void;
}

export function EventPlace({ location, place, onGoToPlace }: EventPlaceProps) {
  return (
    <div className="sec">
      <h4>地點</h4>
      {place !== null ? (
        <button type="button" className="place" onClick={() => onGoToPlace?.(place)}>
          {location} · 在地圖上看
        </button>
      ) : (
        <span className="badge">{location}（無法在示意地圖上定位）</span>
      )}
    </div>
  );
}
