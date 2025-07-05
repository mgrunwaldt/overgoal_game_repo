type Props = {
  statName: string;
  statValue: number;
};

export default function TeamSelectionItem({ statName, statValue }: Props) {
  return (
    <div className="flex flex-col relative w-full group stat-item">
      <div className="flex items-center justify-between mr-3 pb-1 relative">
        <span className="text-xl font-bold text-cyan-200 tracking-wider">
          {statName}
        </span>
        <span className="text-xl font-bold text-cyan-300 stat-value">
          {statValue}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-cyan-500/40 "></div>
      <div
        className="absolute bottom-0 right-0 w-1/3 h-px bg-cyan-500/10  before:content-[''] before:absolute before:top-0 before:right-0 before:border-t-[1px] before:border-r-[1px] before:border-cyan-500/40  before:border-t-cyan-500/40  before:border-r-cyan-500/40  before:transform before:translate-y-[-97%] before:translate-x-[0.1px] 
      before:w-[0px] before:h-2 before:origin-bottom-right before:rotate-45"
      ></div>
      <div
        className="absolute bottom-0 left-0 w-1/3 h-px bg-cyan-500/10  before:content-[''] before:absolute before:top-0 before:left-0 before:border-t-[1px] before:border-l-[1px] before:border-cyan-500/40  before:border-t-cyan-500/40  before:border-l-cyan-500/40  before:transform before:translate-y-[-97%] before:translate-x-[0.1px] 
      before:w-[0px] before:h-2 before:origin-bottom-left before:-rotate-45"
      ></div>
    </div>
  );
}
