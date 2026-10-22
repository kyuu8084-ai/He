const fs = require('fs');
let code = fs.readFileSync('src/components/study-tools/StudyResourcesList.tsx', 'utf8');

const targetRender = `            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {section.items.map((item) => {
                const isFav = favorites.includes(item.id);
                return (
                  <a 
                    key={item.id} 
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-xl transition-all flex flex-col justify-between gap-2.5 cursor-pointer"
                  >
                    <div>
                      {/* Card Header: Badge & Favorite Button */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        {item.badge ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase bg-white/10 text-white/90 px-2 py-0.5 rounded-md border border-white/10">
                            <Tag size={9} className="text-amber-300" />
                            {item.badge}
                          </span>
                        ) : <div />}
                        <div className="flex items-center gap-1">
                          {/* Copy Link */}
                          <button
                            onClick={(e) => copyToClipboard(item.link, item.id, e)}
                            className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                            title={isVi ? "Sao chép liên kết" : "Copy link"}
                          >
                            {copiedId === item.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                          {/* Star Favorite */}
                          <button
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className={\`p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer \${
                              isFav ? 'text-amber-300' : 'text-white/40 hover:text-white'
                            }\`}
                            title={isVi ? "Lưu vào yêu thích" : "Bookmark"}
                          >
                            <Star size={13} className={isFav ? 'fill-amber-300' : ''} />
                          </button>
                        </div>
                      </div>
                      {/* Title */}
                      <div className="flex items-start justify-between gap-2 mt-1">
                        <span className="font-semibold text-xs text-white group-hover:text-[#F598F2] transition-colors leading-snug">
                          {item.title}
                        </span>
                        <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity text-[#F598F2] shrink-0 mt-0.5" />
                      </div>
                      {/* Description */}
                      <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2 mt-1 font-normal">
                        {item.desc}
                      </p>
                    </div>
                    {/* Bottom Indicator */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/40 group-hover:text-white/70 transition-colors">
                      <span className="uppercase tracking-wider font-mono text-[9px]">
                        {item.type || 'web'}
                      </span>
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        {isVi ? 'Truy cập →' : 'Visit →'}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>`;

const replacementRender = `            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 items-start">
              {section.items.map((item) => {
                const isFav = favorites.includes(item.id);
                
                if (item.type === 'tip') {
                  const isExpanded = expandedTipId === item.id;
                  return (
                    <motion.div 
                      key={item.id}
                      layout
                      onClick={() => setExpandedTipId(isExpanded ? null : item.id)}
                      className="group relative p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-xl transition-colors flex flex-col justify-between gap-2.5 cursor-pointer overflow-hidden"
                    >
                      <div>
                        {/* Card Header: Badge & Favorite Button */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          {item.badge ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase bg-white/10 text-white/90 px-2 py-0.5 rounded-md border border-white/10">
                              <Tag size={9} className="text-amber-300" />
                              {item.badge}
                            </span>
                          ) : <div />}
                          <div className="flex items-center gap-1">
                            {/* Star Favorite */}
                            <button
                              onClick={(e) => toggleFavorite(item.id, e)}
                              className={\`p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer \${
                                isFav ? 'text-amber-300' : 'text-white/40 hover:text-white'
                              }\`}
                              title={isVi ? "Lưu vào yêu thích" : "Bookmark"}
                            >
                              <Star size={13} className={isFav ? 'fill-amber-300' : ''} />
                            </button>
                          </div>
                        </div>
                        {/* Title */}
                        <div className="flex items-start justify-between gap-2 mt-1">
                          <span className="font-semibold text-xs text-white group-hover:text-[#F598F2] transition-colors leading-snug">
                            {item.title}
                          </span>
                        </div>
                        {/* Description */}
                        <p className="text-[11px] text-white/60 leading-relaxed mt-1 font-normal">
                          {item.desc}
                        </p>
                        
                        {/* Expandable Content */}
                        <AnimatePresence>
                          {isExpanded && item.content && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="text-[11px] text-white/80 space-y-1.5"
                            >
                              {item.content.map((point, i) => (
                                <div key={i} className="flex gap-2">
                                  <span className="text-[#F598F2]">•</span>
                                  <span>{point}</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {/* Bottom Indicator */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/40 group-hover:text-white/70 transition-colors mt-auto">
                        <span className="uppercase tracking-wider font-mono text-[9px]">
                          tip
                        </span>
                        <span className="group-hover:translate-y-[1px] transition-transform">
                          {isExpanded ? (isVi ? 'Thu gọn ↑' : 'Collapse ↑') : (isVi ? 'Đọc thêm ↓' : 'Read more ↓')}
                        </span>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <a 
                    key={item.id} 
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-xl transition-all flex flex-col justify-between gap-2.5 cursor-pointer h-full"
                  >
                    <div>
                      {/* Card Header: Badge & Favorite Button */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        {item.badge ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase bg-white/10 text-white/90 px-2 py-0.5 rounded-md border border-white/10">
                            <Tag size={9} className="text-amber-300" />
                            {item.badge}
                          </span>
                        ) : <div />}
                        <div className="flex items-center gap-1">
                          {/* Copy Link */}
                          <button
                            onClick={(e) => copyToClipboard(item.link, item.id, e)}
                            className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                            title={isVi ? "Sao chép liên kết" : "Copy link"}
                          >
                            {copiedId === item.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          </button>
                          {/* Star Favorite */}
                          <button
                            onClick={(e) => toggleFavorite(item.id, e)}
                            className={\`p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer \${
                              isFav ? 'text-amber-300' : 'text-white/40 hover:text-white'
                            }\`}
                            title={isVi ? "Lưu vào yêu thích" : "Bookmark"}
                          >
                            <Star size={13} className={isFav ? 'fill-amber-300' : ''} />
                          </button>
                        </div>
                      </div>
                      {/* Title */}
                      <div className="flex items-start justify-between gap-2 mt-1">
                        <span className="font-semibold text-xs text-white group-hover:text-[#F598F2] transition-colors leading-snug">
                          {item.title}
                        </span>
                        <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity text-[#F598F2] shrink-0 mt-0.5" />
                      </div>
                      {/* Description */}
                      <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2 mt-1 font-normal">
                        {item.desc}
                      </p>
                    </div>
                    {/* Bottom Indicator */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/40 group-hover:text-white/70 transition-colors mt-auto">
                      <span className="uppercase tracking-wider font-mono text-[9px]">
                        {item.type || 'web'}
                      </span>
                      <span className="group-hover:translate-x-0.5 transition-transform">
                        {isVi ? 'Truy cập →' : 'Visit →'}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>`;

code = code.replace(targetRender, replacementRender);
fs.writeFileSync('src/components/study-tools/StudyResourcesList.tsx', code);
