'use client';

import { X, History, Clock, User, MapPin, Calendar, CheckCircle2, FileText, Building2, ArrowRight, Clock3, UserCircle } from 'lucide-react';
import { Task, HistoryEntry } from '@/types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
}

export default function HistoryModal({ isOpen, onClose, history }: HistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200 animate-fade-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-700 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Complaint History</h2>
              <p className="text-sm text-indigo-100 mt-0.5">Assignment & Task Timeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:rotate-90"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No history available</p>
                <p className="text-gray-400 text-sm mt-2">This complaint has no assignment history yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((entry, entryIndex) => (
                  <div key={entryIndex} className="relative">
                    {/* Timeline Line */}
                    {entryIndex < history.length - 1 && (
                      <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 to-transparent"></div>
                    )}

                    {/* Assignment Header Card */}
                    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-5 mb-4 border-2 border-indigo-200 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-600 rounded-lg text-white shadow-lg flex-shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-600" />
                              {entry.location}
                            </h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full">
                              <Clock3 className="w-3 h-3 text-indigo-600" />
                              <span className="text-xs font-semibold text-indigo-800">{entry.workDays} days</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Calendar className="w-4 h-4 text-indigo-600" />
                              <span className="font-medium">Assigned:</span>
                              <span className="text-gray-900 font-semibold">{entry.assignedAt}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Clock className="w-4 h-4 text-indigo-600" />
                              <span className="font-medium">Work Duration:</span>
                              <span className="text-gray-900 font-semibold">{entry.workDays} working days</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tasks Timeline */}
                    <div className="ml-6 space-y-4">
                      {entry.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="relative pl-8">
                          {/* Timeline Dot */}
                          <div className="absolute left-0 top-4 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white shadow-lg"></div>
                          
                          {/* Task Card */}
                          <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
                            <div className="p-5">
                              {/* Task Header */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="p-2 bg-indigo-100 rounded-lg">
                                    <UserCircle className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <div className="flex-1">
                                    <a
                                      href={`/user/${task.assigneeId}`}
                                      className="text-indigo-600 hover:text-indigo-800 font-bold text-base hover:underline transition-colors"
                                    >
                                      {task.assigneeId} - {task.assignee}
                                    </a>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-sm text-gray-600 font-medium">{task.assigneeRole}</span>
                                      <ArrowRight className="w-3 h-3 text-gray-400" />
                                      <span className="text-sm text-gray-600 font-medium">{task.assigneeStation}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-xs font-bold text-blue-800">{task.taskNumber}</span>
                                </div>
                              </div>

                              {/* Task Details */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600 font-medium">Date:</span>
                                  <span className="text-gray-900 font-semibold">{task.date}</span>
                                </div>

                                <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-3">
                                  <div className="flex items-start gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Task Completed</div>
                                      <p className="text-gray-900 font-semibold">{task.taskDone}</p>
                                    </div>
                                  </div>
                                </div>

                                {task.detail && (
                                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-start gap-2">
                                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Task Details</div>
                                        <p className="text-gray-700 text-sm leading-relaxed">{task.detail}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Last updated: {task.timestamp}</span>
                                  {task.assignedAt && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <span>Assigned: {task.assignedAt}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-between items-center rounded-b-2xl">
          <button className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2">
            <User className="w-4 h-4" />
            User Log
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

