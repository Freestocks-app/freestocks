import { Ticket, Clock, TrendingUp } from "lucide-react";

export default function LotteryPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] pb-20 md:pb-6 flex items-center justify-center">
      <div className="max-w-sm mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cta/10 border border-cta/20 flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-8 h-8 text-cta" />
        </div>
        
        <h1 className="text-xl font-bold mb-2">Lottery</h1>
        <p className="text-sm text-muted mb-6">
          Win big with your earnings. Coming soon to Freestocks.
        </p>

        <div className="card p-4 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gain/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-gain" />
            </div>
            <div>
              <p className="text-sm font-medium">Stock prizes</p>
              <p className="text-xs text-muted">Win tokenized shares</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cta/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-cta" />
            </div>
            <div>
              <p className="text-sm font-medium">Daily draws</p>
              <p className="text-xs text-muted">Free entries from earning</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted mt-4">
          Launching after Stocklana hackathon
        </p>
      </div>
    </div>
  );
}
