export default function Footer() {
  const linkGroups = {
    Product: ['Features', 'Pricing', 'Integrations'],
    Company: ['About', 'Blog', 'Careers'],
    Resources: ['Documentation', 'Help Center', 'API'],
  };

  return (
    <footer className="border-t border-border px-4 sm:px-6 py-10 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold text-foreground">MicroDo</span>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[200px]">
              Smart, simple, and efficient task management for modern teams.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(linkGroups).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-sm font-bold text-foreground mb-3">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          {/* Newsletter (matching light mode ref) */}
          <div className="flex items-center gap-3 order-2 sm:order-1">
            <div className="flex items-center bg-muted rounded-xl overflow-hidden border border-border">
              <input
                type="email"
                placeholder="Newsletter for email"
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground px-4 py-2 outline-none w-44 sm:w-52"
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground order-3 sm:order-2">
            © {new Date().getFullYear()} MicroDo. All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-3 order-1 sm:order-3">
            {['Fb', 'Tw', 'Yt', 'Ig'].map((social) => (
              <div
                key={social}
                className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all duration-200"
              >
                <span className="text-[10px] font-bold text-muted-foreground">{social}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
