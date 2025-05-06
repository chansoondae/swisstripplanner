'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from './../../../lib/firebase';
import { useAnalytics } from './../../hooks/useAnalytics';
import { FiArrowLeft, FiSave, FiCopy } from 'react-icons/fi';
import ChatButtonPortal from './../../components/ChatButtonPortal';
import { useAuth } from '../../../context/AuthContext';
import TransportationCost from './../../components/TransportationCost';
import AccommodationEdit from './../../components/AccommodationEdit';
import { calculateTravelPlan } from './../../../utils/calculateTravelPlan';
import locationData from './../../../utils/locationData';
import './../../../styles/consulting.css';

// Import created components
import DaySection from './DaySection';
import { LoadingState, ErrorState, NotFoundState, ProcessingState } from './UIStates';
import EditableTitleDescription from './EditableTitleDescription';
import DeleteConfirmModal from './DeleteConfirmModal';
import { formatRelativeTime, generateLocationsFromActivities, travelStyleMap, groupTypeMap } from './utils';

export default function ConsultingPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id;
  const { user } = useAuth();
  const { trackPageView, trackEvent } = useAnalytics();
  
  const [plan, setPlan] = useState(null);
  const [localTravelPlan, setLocalTravelPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Main plan editing state
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Track page view on load
  useEffect(() => {
    if (planId) {
      trackPageView(`여행 상담 상세: ${planId}`);
    }
  }, [trackPageView, planId]);
  
  // Mobile detection
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isMobileDevice = /iphone|ipad|ipod|android/.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // Update localTravelPlan when plan changes
  useEffect(() => {
    if (plan) {
      setLocalTravelPlan(plan);
      setEditTitle(plan.title || '');
      setEditDescription(plan.description || '');
    }
  }, [plan]);
  
  // Check travel plan status
  const checkPlanStatus = (planData) => {
    if (!planData) return 'loading';
    
    // Check status field if it exists
    if (planData.status) {
      return planData.status;
    }
    
    // Check for empty days array
    if (!planData.days || !Array.isArray(planData.days) || planData.days.length === 0) {
      return 'processing';
    }
    
    // Check for missing title and description
    if (!planData.title || !planData.description) {
      return 'processing';
    }
    
    return 'completed';
  };
  
  // Start editing main title and description
  const handleStartEditPlan = () => {
    setIsEditingPlan(true);
    
    // Track event: start editing plan title/description
    trackEvent('start_edit_plan', 'engagement', '여행 계획 제목/설명 수정 시작');
  };
  
  // Cancel editing main title and description
  const handleCancelEditPlan = () => {
    setIsEditingPlan(false);
    setEditTitle(localTravelPlan.title || '');
    setEditDescription(localTravelPlan.description || '');
    
    // Track event: cancel editing plan title/description
    trackEvent('cancel_edit_plan', 'engagement', '여행 계획 제목/설명 수정 취소');
  };
  
  // Save main title and description
  const handleSavePlan = (newTitle, newDescription) => {
    // Use parameters if provided, otherwise use state values
    const titleToSave = newTitle !== undefined ? newTitle : editTitle;
    const descriptionToSave = newDescription !== undefined ? newDescription : editDescription;
    
    // Don't save if there are no changes
    if (titleToSave === localTravelPlan.title && descriptionToSave === localTravelPlan.description) {
      setIsEditingPlan(false);
      return;
    }
    
    // Update local state
    const updatedPlan = {
      ...localTravelPlan,
      title: titleToSave,
      description: descriptionToSave
    };
    
    setLocalTravelPlan(updatedPlan);
    
    // Exit editing mode
    setIsEditingPlan(false);
    
    // Track changes
    setHasUnsavedChanges(true);
    
    // Track event: save plan title/description
    trackEvent('save_edit_plan', 'content_update', '여행 계획 제목/설명 수정 저장');
  };
  
  // Update day information
  const handleUpdateDay = (dayNumber, updates) => {
    if (!isOwner) return;
    
    // Copy local state
    const updatedPlan = { ...localTravelPlan };
    
    // Find the day
    const dayIndex = updatedPlan.days.findIndex(d => d.day === dayNumber);
    
    if (dayIndex !== -1) {
      // Update day information
      updatedPlan.days[dayIndex] = {
        ...updatedPlan.days[dayIndex],
        ...updates
      };
      
      // Recalculate travel plan if activities changed
      const recalculatedPlan = updates.activities 
        ? calculateTravelPlan(updatedPlan) 
        : updatedPlan;
      
      // Update local state
      setLocalTravelPlan(recalculatedPlan);
      setHasUnsavedChanges(true);
      
      // Track event: update day information
      trackEvent(
        'update_day_info', 
        'content_update',
        `일자 정보 업데이트 (Day ${dayNumber})`
      );
    }
  };
  
  // Save as mine function
  const saveAsMine = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    if (!plan) return;
    
    setIsSaving(true);
    try {
      // Copy existing plan to create a new document
      const newPlanData = {
        ...plan,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        copiedFrom: planId // Store original plan ID
      };
      
      // Add new document
      const docRef = await addDoc(collection(db, 'travelPlans'), newPlanData);
      
      // Track event: save as mine
      trackEvent('copy_to_own', 'conversion', `내 여행으로 저장: ${planId} -> ${docRef.id}`);
      
      // Show success message
      setSaveSuccess(true);
      
      // Redirect to new plan page after 1.5 seconds
      setTimeout(() => {
        router.push(`/planner/${docRef.id}`);
      }, 1500);
      
    } catch (error) {
      console.error("저장 중 오류 발생:", error);
      trackEvent('error', 'system', `내 여행으로 저장 오류: ${error.message}`);
      alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save changes handler
  const handleSaveChanges = async () => {
    if (!isOwner) {
      alert("이 여행 계획의 소유자만 수정할 수 있습니다. '내 여행으로 저장' 기능을 이용해주세요.");
      return;
    }
    
    if (!hasUnsavedChanges || !localTravelPlan) return;
    
    setIsSaving(true);
    
    try {
      // Update Firebase document
      const travelPlanRef = doc(db, 'travelPlans', planId);
      await updateDoc(travelPlanRef, {
        title: localTravelPlan.title,
        description: localTravelPlan.description,
        days: localTravelPlan.days,
        transportationDetails: localTravelPlan.transportationDetails,
        budgetBreakdown: localTravelPlan.budgetBreakdown,
        updatedAt: new Date()
      });
      
      // Show success message
      setSaveSuccess(true);
      
      // Reset unsaved changes state
      setHasUnsavedChanges(false);
      
      // Track event: save travel plan
      trackEvent('save_content', 'engagement', `여행 계획 저장: ${planId}`);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving changes:', error);
      trackEvent('error', 'system', `여행 계획 저장 오류: ${error.message}`);
      alert("변경사항 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete activity handler
  const handleDeleteClick = useCallback((day, activityIndex) => {
    // Check if activity exists
    const dayIndex = localTravelPlan.days.findIndex(d => d.day === day);
    const activityToRemove = localTravelPlan.days[dayIndex]?.activities[activityIndex];
    
    setActivityToDelete({ day, activityIndex });
    setDeleteConfirmOpen(true);

    // Track event: open delete confirmation modal
    if (activityToRemove) {
      trackEvent(
        'open_delete_modal', 
        'engagement', 
        `활동 삭제 모달 열기: ${activityToRemove.title}`,
        {
          day: day,
          activity_title: activityToRemove.title,
          activity_location: activityToRemove.location
        }
      );
    }
  }, [localTravelPlan, trackEvent]);

  // Cancel delete handler
  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
    setActivityToDelete(null);

    // Track event: cancel delete
    trackEvent('cancel_delete', 'engagement', '활동 삭제 취소');
  }, [trackEvent]);
  
  // Confirm delete handler
  const handleConfirmDelete = useCallback(() => {
    if (!activityToDelete) return;

    // Set loading state
    setIsDeleting(true);

    try {
      // Create a copy of current data
      const updatedPlan = { ...localTravelPlan };
      const { day, activityIndex } = activityToDelete;
      const dayIndex = updatedPlan.days.findIndex(d => d.day === day);
      
      // Get reference to the activity being deleted before removing it
      const activityBeingDeleted = updatedPlan.days[dayIndex].activities[activityIndex];

      // Delete the activity
      updatedPlan.days[dayIndex].activities.splice(activityIndex, 1);

      // Recalculate the entire travel plan to update transportation details
      const recalculatedPlan = calculateTravelPlan(updatedPlan);

      // Update local state
      setLocalTravelPlan(recalculatedPlan);
      setHasUnsavedChanges(true);

      // Track event: delete activity
      if (activityBeingDeleted) {
        trackEvent(
          'delete_activity', 
          'content_update',
          `활동 삭제: ${activityBeingDeleted.title}`,
          {
            day: day,
            activity_title: activityBeingDeleted.title,
            activity_location: activityBeingDeleted.location
          }
        );
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      // Track error event
      trackEvent('error', 'system', `활동 삭제 오류: ${error.message}`);
    } finally {
      // Close modal and reset state
      setDeleteConfirmOpen(false);
      setActivityToDelete(null);
      setIsDeleting(false);
    }
  }, [activityToDelete, localTravelPlan, trackEvent]);
  
  // Add activity handler
  const handleAddActivity = useCallback((day, newActivity) => {
    // Only allow owners to add activities
    if (!isOwner) return;

    // Create a copy of current data
    const updatedPlan = { ...localTravelPlan };
    
    // Find the day to add activity to
    const dayIndex = updatedPlan.days.findIndex(d => d.day === day);
    
    if (dayIndex !== -1) {
      // Add new activity to the list
      updatedPlan.days[dayIndex].activities.push(newActivity);

      // Recalculate the entire travel plan to update transportation details
      const recalculatedPlan = calculateTravelPlan(updatedPlan);
      
      // Update local state
      setLocalTravelPlan(recalculatedPlan);
      setHasUnsavedChanges(true);
      
      // Track event: add activity
      trackEvent(
        'add_activity', 
        'content_update',
        `활동 추가: ${newActivity.title}`,
        {
          day: day,
          activity_title: newActivity.title,
          activity_location: newActivity.location,
          activity_price: newActivity.price || 0
        }
      );
    }
  }, [localTravelPlan, isOwner, trackEvent]);
  
  // Update accommodation handler
  const updateAccommodation = useCallback((updatedPlan) => {
    if (!isOwner) return;
    
    setLocalTravelPlan(updatedPlan);
    setHasUnsavedChanges(true);

    // Track event: update accommodation
    trackEvent(
      'update_accommodation', 
      'content_update',
      `숙소 정보 업데이트`
    );
  }, [isOwner, trackEvent]);
  
  // Fetch travel plan data
  const fetchTravelPlan = async (isRefreshing = false) => {
    if (!planId) {
      setError('유효하지 않은 여행 계획 ID입니다.');
      setLoading(false);
      return;
    }
    
    try {
      // Only show loading state when first loading (not refreshing)
      if (!isRefreshing) {
        setLoading(true);
      }
      
      // Fetch travel plan data from Firestore
      const planDoc = await getDoc(doc(db, 'travelPlans', planId));
      
      if (planDoc.exists()) {
        const planData = planDoc.data();

        // Log the entire travel plan JSON for debugging
        console.log('Travel Plan JSON:', JSON.stringify(planData, null, 2));

        setPlan(planData);
        setLocalTravelPlan(planData);
        
        // Check if user is the plan owner
        setIsOwner(user && planData.userId === user.uid);
        
        // Check plan status
        const status = checkPlanStatus(planData);
        
        // Track event: view travel plan
        trackEvent(
          'view_content', 
          'content', 
          `여행 상담 조회: ${planId}`, 
          {
            owner: (user && planData.userId === user.uid),
            status: status,
            title: planData.title || '제목 없음'
          }
        );
        
        // If plan is processing, check again in 5 seconds
        if (status === 'processing') {
          // Track event: view processing plan
          trackEvent('view_processing_content', 'content', `생성 중인 여행 상담 조회: ${planId}`);
          setTimeout(() => fetchTravelPlan(true), 5000);
        }
      } else {
        setError('여행 계획을 찾을 수 없습니다.');
        trackEvent('error', 'content', `존재하지 않는 여행 계획: ${planId}`);
      }
    } catch (err) {
      console.error('여행 계획 불러오기 오류:', err);
      setError('여행 계획을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
      trackEvent('error', 'system', `여행 계획 불러오기 오류: ${err.message}`);
    } finally {
      // Only update loading state when first loading (not refreshing)
      if (!isRefreshing) {
        setLoading(false);
      }
    }
  };
  
  // Fetch data when component mounts or planId or user changes
  useEffect(() => {
    fetchTravelPlan();
  }, [planId, user]);
  
  // Check plan status
  const planStatus = plan ? checkPlanStatus(plan) : 'loading';
  const isProcessing = planStatus === 'processing';
  
  // Loading state
  if (loading) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>
        <LoadingState message="여행 상담 내용을 불러오는 중..." />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>
        <ErrorState error={error} />
      </div>
    );
  }
  
  // Not found state
  if (!plan) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>
        <NotFoundState />
      </div>
    );
  }
  
  // Processing state
  if (isProcessing) {
    return (
      <div className={`max-w-5xl mx-auto ${isMobile ? 'p-2' : 'px-4 py-6'}`}>        
        <ProcessingState 
          plan={plan}
          isMobile={isMobile} 
          router={router}
          formatRelativeTime={formatRelativeTime}
          trackEvent={trackEvent}
        />
      </div>
    );
  }
  
  // Completed plan display
  return (
    <div className={`max-w-5xl mx-auto ${isMobile ? 'p-0' : 'px-4 py-2'}`}>
      {/* Top info and travel overview */}
      <div className="p-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-4">
            <EditableTitleDescription
              title={localTravelPlan.title}
              description={localTravelPlan.description}
              isEditing={isEditingPlan}
              onStartEdit={isOwner ? handleStartEditPlan : null}
              onSave={handleSavePlan}
              onCancel={handleCancelEditPlan}
              setTitle={setEditTitle}
              setDescription={setEditDescription}
            />
          </div>
          
          {/* Action buttons for owners */}
          {isOwner && hasUnsavedChanges && (
            <div className="flex">
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className={`ml-2 px-4 py-2 bg-black text-white rounded-md flex items-center ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'
                }`}
                style={{ fontFamily: 'Nanum Gothic' }}
              >
                <FiSave className="mr-1" /> {isSaving ? '저장 중...' : '변경사항 저장'}
              </button>
            </div>
          )}
          
          {/* Save as mine button for non-owners */}
          {!isOwner && user && (
            <div className="flex">
              <button
                onClick={saveAsMine}
                disabled={isSaving}
                className={`ml-2 px-4 py-2 bg-black text-white rounded-md flex items-center ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-800'
                }`}
                style={{ fontFamily: 'Nanum Gothic' }}
              >
                <FiCopy className="mr-1" /> {isSaving ? '저장 중...' : '내 여행으로 저장'}
              </button>
            </div>
          )}
        </div>
        
        {/* Success message */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md" style={{ fontFamily: 'Nanum Gothic' }}>
            변경사항이 성공적으로 저장되었습니다.
          </div>
        )}
      </div>
      
      {/* Travel plan scroll section */}
      <div className="my-6">
        <h2 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: 'Nanum Gothic', fontSize: '24px', fontWeight: 'bold' }}>일별 여행 일정</h2>
        
        {/* Day sections */}
        <div>
          {localTravelPlan.days.sort((a, b) => a.day - b.day).map((day) => (
            <DaySection 
              key={day.day} 
              day={day}
              generateLocationsFromActivities={generateLocationsFromActivities}
              activeDay={day.day}
              onAddActivity={handleAddActivity}
              onDeleteActivity={handleDeleteClick}
              isOwner={isOwner}
              localTravelPlan={localTravelPlan}
              onUpdateAccommodation={updateAccommodation}
              onUpdateDay={handleUpdateDay}
              isMobile={isMobile}
              trackEvent={trackEvent}
            />
          ))}
        </div>
      </div>
      
      {/* Transportation cost information component */}
      {localTravelPlan.transportationDetails && localTravelPlan.budgetBreakdown && (
        <TransportationCost 
          transportationDetails={localTravelPlan.transportationDetails} 
          budgetBreakdown={localTravelPlan.budgetBreakdown} 
        />
      )}
      
      {/* Optional chat button for follow-up questions */}
      {process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true' && <ChatButtonPortal />}
      
      {/* Back to list button */}
      <div className="my-8 flex justify-center space-x-4">
        <button 
          onClick={() => {
            trackEvent('button_click', 'navigation', '상담 목록으로 돌아가기');
            router.push('/consulting');
          }}
          className="btn flex items-center bg-white hover:bg-gray-100 text-black font-medium px-4 py-2 rounded-md transition-colors border border-gray-300"
          style={{ fontFamily: 'Nanum Gothic' }}
        >
          <FiArrowLeft className="mr-2" /> 상담 목록으로 돌아가기
        </button>
        <button 
          onClick={() => {
            trackEvent('button_click', 'navigation', '컨설팅 모드');
            router.push(`/consulting/${planId}`);
          }}
          className="btn flex items-center bg-white hover:bg-gray-100 text-black font-medium px-4 py-2 rounded-md transition-colors border border-gray-300"
          style={{ fontFamily: 'Nanum Gothic' }}
        >
          컨설팅 모드
        </button>
        
      </div>
      
      {/* Delete confirmation dialog */}
      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}