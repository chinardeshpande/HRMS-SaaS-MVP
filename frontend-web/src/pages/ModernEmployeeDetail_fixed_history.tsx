// This is just the fixed organizational history section - copy and paste this into ModernEmployeeDetail.tsx

{/* Organizational History Tab */}
{activeTab === 'history' && (
  <div>
    {employee.organizationalHistory && employee.organizationalHistory.length > 0 ? (
      <div className="overflow-x-auto pb-4 relative">
        {/* Horizontal Timeline Line */}
        <div className="absolute left-0 right-0 top-28 h-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full mx-6"></div>

        <div className="flex gap-6 px-6 pt-4">
          {/* Timeline Events */}
          {employee.organizationalHistory
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((event) => {
              const colorClasses = {
                joining: {
                  bg: 'bg-success-600',
                  border: 'border-success-600',
                  text: 'text-success-600',
                  bgLight: 'bg-success-50',
                  borderLight: 'border-success-200',
                },
                promotion: {
                  bg: 'bg-primary-600',
                  border: 'border-primary-600',
                  text: 'text-primary-600',
                  bgLight: 'bg-primary-50',
                  borderLight: 'border-primary-200',
                },
                transfer: {
                  bg: 'bg-purple-600',
                  border: 'border-purple-600',
                  text: 'text-purple-600',
                  bgLight: 'bg-purple-50',
                  borderLight: 'border-purple-200',
                },
                salary_increase: {
                  bg: 'bg-success-600',
                  border: 'border-success-600',
                  text: 'text-success-600',
                  bgLight: 'bg-success-50',
                  borderLight: 'border-success-200',
                },
                performance_review: {
                  bg: 'bg-warning-600',
                  border: 'border-warning-600',
                  text: 'text-warning-600',
                  bgLight: 'bg-warning-50',
                  borderLight: 'border-warning-200',
                },
                probation_end: {
                  bg: 'bg-success-600',
                  border: 'border-success-600',
                  text: 'text-success-600',
                  bgLight: 'bg-success-50',
                  borderLight: 'border-success-200',
                },
              };

              const colors = colorClasses[event.type];

              return (
                <div key={event.id} className="relative flex flex-col items-center min-w-[320px] max-w-[320px]">
                  {/* Date Badge at Top */}
                  <div className={`mb-6 px-4 py-2 rounded-xl ${colors.bg} text-white font-bold text-sm shadow-lg min-w-[200px] text-center`}>
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  {/* Timeline Dot */}
                  <div className={`w-12 h-12 rounded-full bg-white border-4 ${colors.border} flex items-center justify-center shadow-lg z-10 mb-4 ${colors.text}`}>
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event Card */}
                  <div className={`card border-2 ${colors.border} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 w-full h-56`}>
                    <div className="card-body p-4">
                      {/* Icon Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg ${colors.bgLight} flex items-center justify-center ${colors.text}`}>
                          {getEventIcon(event.type)}
                        </div>
                        <h4 className={`font-bold text-sm ${colors.text}`}>{event.title}</h4>
                      </div>

                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{event.description}</p>

                      {/* Event Details */}
                      {event.details && (
                        <div className="space-y-2">
                          {event.details.from && event.details.to && (
                            <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${colors.bgLight} border ${colors.borderLight}`}>
                              <span className="text-xs font-semibold text-gray-600">{event.details.from}</span>
                              <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center text-white text-xs font-bold`}>
                                →
                              </div>
                              <span className={`text-xs font-bold ${colors.text}`}>{event.details.to}</span>
                            </div>
                          )}
                          <div className="flex gap-2 justify-center">
                            {event.details.amount && (
                              <span className="badge badge-success">+{event.details.amount}%</span>
                            )}
                            {event.details.rating && (
                              <span className="badge badge-warning flex items-center gap-1">
                                <StarIcon className="h-3 w-3" />
                                {event.details.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    ) : (
      <div className="text-center py-12">
        <HistoryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-500 mb-2">No History Available</h3>
        <p className="text-sm text-gray-400">Organizational history will appear here as events occur</p>
      </div>
    )}
  </div>
)}
