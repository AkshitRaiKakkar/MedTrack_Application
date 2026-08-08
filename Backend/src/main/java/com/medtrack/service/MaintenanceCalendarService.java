package com.medtrack.service;

import com.medtrack.dto.MaintenanceCalendarResponse;
import com.medtrack.dto.MaintenanceScheduleRequest;
import com.medtrack.dto.MaintenanceScheduleResponse;
import com.medtrack.dto.OverdueMaintenanceResponse;
import com.medtrack.dto.UpcomingMaintenanceResponse;
import com.medtrack.repository.EquipmentRepository;
import com.medtrack.repository.HospitalRepository;
import com.medtrack.repository.MaintenanceTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceCalendarService {

    private final EquipmentRepository equipmentRepository;
    private final MaintenanceTaskRepository maintenanceTaskRepository;
    private final HospitalRepository hospitalRepository;

    public MaintenanceCalendarResponse getCalendar(String email) {

        public MaintenanceCalendarResponse getCalendar(String email) {

            Hospital hospital = hospitalRepository.findByEmail(email)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Hospital not found"));

            Long hospitalId = hospital.getId();

            List<MaintenanceTask> allTasks =
                    maintenanceTaskRepository.findByEquipmentHospitalId(hospitalId);

            LocalDate today = LocalDate.now();

            long total =
                    allTasks.size();

            long scheduled =
                    allTasks.stream()
                            .filter(t -> t.getStatus() == MaintenanceStatus.SCHEDULED)
                            .count();

            long completed =
                    allTasks.stream()
                            .filter(t -> t.getStatus() == MaintenanceStatus.COMPLETED)
                            .count();

            long inProgress =
                    allTasks.stream()
                            .filter(t -> t.getStatus() == MaintenanceStatus.IN_PROGRESS)
                            .count();

            long overdue =
                    allTasks.stream()
                            .filter(task ->
                                    task.getScheduledDate().isBefore(today)
                                            &&
                                            task.getStatus() != MaintenanceStatus.COMPLETED
                            )
                            .count();

            List<MaintenanceScheduleResponse> schedules =
                    allTasks.stream()
                            .map(task -> {

                                MaintenanceScheduleResponse dto =
                                        new MaintenanceScheduleResponse();

                                dto.setId(task.getId());

                                dto.setEquipmentId(
                                        task.getEquipment().getId()
                                );

                                dto.setEquipmentName(
                                        task.getEquipment().getName()
                                );

                                dto.setTitle(
                                        task.getTitle()
                                );

                                dto.setScheduledDate(
                                        task.getScheduledDate()
                                );

                                dto.setAssignedTechnician(
                                        task.getAssignedTechnician()
                                );

                                dto.setPriority(
                                        task.getPriority()
                                );

                                dto.setStatus(
                                        task.getStatus()
                                );

                                return dto;

                            })
                            .toList();

            MaintenanceCalendarResponse response =
                    new MaintenanceCalendarResponse();

            response.setTotalSchedules(total);
            response.setScheduled(scheduled);
            response.setCompleted(completed);
            response.setInProgress(inProgress);
            response.setTotalOverdue(overdue);
            response.setSchedules(schedules);

            return response;
        }

        return new MaintenanceCalendarResponse();

    }

    public List<UpcomingMaintenanceResponse> getUpcoming(String email) {

        return Collections.emptyList();

    }

    public List<OverdueMaintenanceResponse> getOverdue(String email) {

        return Collections.emptyList();

    }

    public MaintenanceScheduleResponse createSchedule(
            MaintenanceScheduleRequest request,
            String email
    ) {

        Hospital hospital = hospitalRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));

        MaintenanceTask task = new MaintenanceTask();

        task.setEquipment(equipment);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setScheduledDate(request.getScheduledDate());
        task.setAssignedTechnician(request.getAssignedTechnician());
        task.setPriority(request.getPriority());
        task.setStatus(MaintenanceStatus.SCHEDULED);

        maintenanceTaskRepository.save(task);

        MaintenanceScheduleResponse response = new MaintenanceScheduleResponse();

        response.setId(task.getId());
        response.setEquipmentId(equipment.getId());
        response.setEquipmentName(equipment.getName());
        response.setTitle(task.getTitle());
        response.setScheduledDate(task.getScheduledDate());
        response.setAssignedTechnician(task.getAssignedTechnician());
        response.setPriority(task.getPriority());
        response.setStatus(task.getStatus());

        return response;
    }
    public List<UpcomingMaintenanceResponse> getUpcoming(String email) {

        Hospital hospital = hospitalRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        LocalDate today = LocalDate.now();
        LocalDate nextMonth = today.plusDays(30);

        List<MaintenanceTask> tasks =
                maintenanceTaskRepository.findByEquipmentHospitalIdAndScheduledDateBetween(
                        hospital.getId(),
                        today,
                        nextMonth
                );

        return tasks.stream().map(task -> {

            UpcomingMaintenanceResponse response =
                    new UpcomingMaintenanceResponse();

            response.setTaskId(task.getId());
            response.setEquipmentId(task.getEquipment().getId());
            response.setEquipmentName(task.getEquipment().getName());
            response.setScheduledDate(task.getScheduledDate());
            response.setAssignedTechnician(task.getAssignedTechnician());
            response.setStatus(task.getStatus());

            return response;

        }).toList();

    }
    public List<OverdueMaintenanceResponse> getOverdue(String email) {

        Hospital hospital = hospitalRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));

        List<MaintenanceTask> tasks =
                maintenanceTaskRepository.findByEquipmentHospitalIdAndScheduledDateBefore(
                        hospital.getId(),
                        LocalDate.now()
                );

        return tasks.stream().map(task -> {

            OverdueMaintenanceResponse response =
                    new OverdueMaintenanceResponse();

            response.setTaskId(task.getId());
            response.setEquipmentName(task.getEquipment().getName());
            response.setScheduledDate(task.getScheduledDate());
            response.setAssignedTechnician(task.getAssignedTechnician());

            long days =
                    ChronoUnit.DAYS.between(
                            task.getScheduledDate(),
                            LocalDate.now()
                    );

            response.setDaysOverdue(days);

            return response;

        }).toList();

    }

}