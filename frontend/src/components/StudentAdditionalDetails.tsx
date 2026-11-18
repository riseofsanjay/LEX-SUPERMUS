"use client";

import { useEffect, useState, type FormEvent } from "react";
import { GraduationCap, Pencil, Plus } from "lucide-react";
import {
  parseStudentEducationDetails,
  STUDENT_EDUCATION_STORAGE_KEY,
  type AdditionalCourse,
  type EducationEntry,
  type StudentEducationDetails,
} from "@/lib/student-resume";

const EMPTY_EDUCATION: EducationEntry = {
  institution: "",
  qualification: "",
  completionYear: "",
  score: "",
};

const EMPTY_DETAILS: StudentEducationDetails = {
  ssc: { ...EMPTY_EDUCATION },
  hsc: { ...EMPTY_EDUCATION },
  ug: { ...EMPTY_EDUCATION },
  pg: { ...EMPTY_EDUCATION },
  additionalCourses: [],
  experience: {
    organization: "",
    role: "",
    duration: "",
    description: "",
  },
};

const REQUIRED_EDUCATION_LEVELS = [
  { key: "ssc", title: "SSC (Class 10)", required: true },
  { key: "hsc", title: "HSC (Class 12)", required: true },
  { key: "ug", title: "Undergraduate (UG)", required: true },
] as const;

const EDUCATION_LEVELS = [
  ...REQUIRED_EDUCATION_LEVELS,
  { key: "pg", title: "Postgraduate (PG)", required: false },
] as const;

function hasRequiredEducation(details: StudentEducationDetails): boolean {
  return (["ssc", "hsc", "ug"] as const).every((key) =>
    Object.values(details[key]).every((value) => value.trim().length > 0)
  );
}

function getField(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

type EducationYearField = "ssc" | "hsc" | "ug" | "pg";
type EducationYearErrors = Partial<Record<EducationYearField, string>>;

function getEducationYearErrors(
  formData: FormData,
  pgAvailable: boolean,
  pgCurrentlyPursuing: boolean,
): EducationYearErrors {
  const sscYear = getField(formData, "sscCompletionYear");
  const hscYear = getField(formData, "hscCompletionYear");
  const ugYear = getField(formData, "ugCompletionYear");
  const pgYear = getField(formData, "pgCompletionYear");
  const errors: EducationYearErrors = {};

  if (sscYear && hscYear && Number(hscYear) <= Number(sscYear)) {
    errors.hsc = "HSC year must be after the SSC year.";
  }
  if (hscYear && ugYear && Number(ugYear) <= Number(hscYear)) {
    errors.ug = "UG year must be after the HSC year.";
  }
  if (pgAvailable && ugYear && pgYear && Number(pgYear) <= Number(ugYear)) {
    errors.pg = pgCurrentlyPursuing
      ? "Expected PG completion year must be after the UG year."
      : "PG year must be after the UG year.";
  }

  return errors;
}

export default function StudentAdditionalDetails() {
  const [details, setDetails] = useState<StudentEducationDetails>(EMPTY_DETAILS);
  const [additionalCourses, setAdditionalCourses] = useState<AdditionalCourse[]>([]);
  const [ugCurrentlyPursuing, setUgCurrentlyPursuing] = useState(false);
  const [pgCurrentlyPursuing, setPgCurrentlyPursuing] = useState(false);
  const [yearErrors, setYearErrors] = useState<EducationYearErrors>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [hasSaved, setHasSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    try {
      const savedDetails = window.localStorage.getItem(STUDENT_EDUCATION_STORAGE_KEY);
      if (savedDetails) {
        const parsed = parseStudentEducationDetails(JSON.parse(savedDetails));
        if (parsed) {
          setDetails(parsed);
          setAdditionalCourses(parsed.additionalCourses);
          setUgCurrentlyPursuing(parsed.ugCurrentlyPursuing ?? false);
          setPgCurrentlyPursuing(parsed.pgCurrentlyPursuing ?? false);
          const complete = hasRequiredEducation(parsed);
          setHasSaved(complete);
          setIsEditing(!complete);
        } else {
          setError("Saved education details could not be read. Please enter and save them again.");
        }
      }
    } catch {
      setError("Education details could not be loaded from this browser.");
    } finally {
      setReady(true);
    }
  }, []);

  function updateAdditionalCourse(
    index: number,
    field: keyof AdditionalCourse,
    value: string,
  ) {
    setAdditionalCourses((courses) =>
      courses.map((course, courseIndex) =>
        courseIndex === index ? { ...course, [field]: value } : course
      )
    );
  }

  function addAdditionalCourse() {
    setAdditionalCourses((courses) => [
      ...courses,
      { name: "", organization: "", year: "" },
    ]);
  }

  function removeAdditionalCourse(index: number) {
    setAdditionalCourses((courses) =>
      courses.filter((_, courseIndex) => courseIndex !== index)
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const educationDetails = (key: string): EducationEntry => ({
      institution: getField(formData, `${key}Institution`),
      qualification: getField(formData, `${key}Qualification`),
      completionYear: getField(formData, `${key}CompletionYear`),
      score: getField(formData, `${key}Score`),
    });
    const isUgCurrentlyPursuing = formData.has("ugCurrentlyPursuing");
    const isPgCurrentlyPursuing =
      !isUgCurrentlyPursuing && formData.has("pgCurrentlyPursuing");
    const nextYearErrors = getEducationYearErrors(
      formData,
      !isUgCurrentlyPursuing,
      isPgCurrentlyPursuing,
    );
    setYearErrors(nextYearErrors);
    if (Object.keys(nextYearErrors).length > 0) {
      return;
    }

    const savedAdditionalCourses = additionalCourses
      .map((course) => ({
        name: course.name.trim(),
        organization: course.organization.trim(),
        year: course.year.trim(),
      }))
      .filter((course) => Object.values(course).some(Boolean));
    const nextDetails: StudentEducationDetails = {
      ssc: educationDetails("ssc"),
      hsc: educationDetails("hsc"),
      ug: educationDetails("ug"),
      pg: isUgCurrentlyPursuing ? { ...EMPTY_EDUCATION } : educationDetails("pg"),
      additionalCourses: savedAdditionalCourses,
      ugCurrentlyPursuing: isUgCurrentlyPursuing,
      pgCurrentlyPursuing: isPgCurrentlyPursuing,
      experience: {
        organization: getField(formData, "experienceOrganization"),
        role: getField(formData, "experienceRole"),
        duration: getField(formData, "experienceDuration"),
        description: getField(formData, "experienceDescription"),
      },
    };

    try {
      window.localStorage.setItem(STUDENT_EDUCATION_STORAGE_KEY, JSON.stringify(nextDetails));
      setDetails(nextDetails);
      setAdditionalCourses(savedAdditionalCourses);
      setUgCurrentlyPursuing(isUgCurrentlyPursuing);
      setPgCurrentlyPursuing(isPgCurrentlyPursuing);
      setYearErrors({});
      setError("");
      setHasSaved(true);
      setIsEditing(false);
    } catch {
      setError("Education details could not be saved in this browser. Please try again.");
    }
  }

  if (!ready) {
    return (
      <section className="item student-additional-details" aria-busy="true">
        <h2>Education &amp; experience</h2>
        <p>Loading your saved details…</p>
      </section>
    );
  }

  return (
    <section className="item student-additional-details">
      <div className="student-details-heading">
        <div>
          <h2>Education &amp; experience</h2>
          <p className="sub">
            SSC, HSC, and UG details are required. PG is optional unless you are pursuing UG.
            Enter completion years in study order, with PG after UG.
          </p>
        </div>
        {!isEditing && (
          <div className="student-details-actions">
            <span className="student-details-success" role="status">✓ Saved</span>
            <button
              type="button"
              className="resume-secondary-button student-edit-button"
              aria-label="Edit education and experience details"
              onClick={() => {
                setIsEditing(true);
              }}
            >
              <Pencil size={15} aria-hidden="true" />
              Edit
            </button>
          </div>
        )}
      </div>
      {isEditing ? (
      <form onSubmit={handleSubmit}>
        <div className="student-education-grid">
          {REQUIRED_EDUCATION_LEVELS.map(({ key, title, required }) => (
            <fieldset className="student-details-section" key={key}>
              <legend>
                {`${title}${required ? " *" : " (optional)"}`}
              </legend>
              <label htmlFor={`${key}-institution`}>Institution name</label>
              <input
                id={`${key}-institution`}
                name={`${key}Institution`}
                defaultValue={details[key].institution}
                required={required}
              />
              <label htmlFor={`${key}-qualification`}>Board / degree / qualification</label>
              <input
                id={`${key}-qualification`}
                name={`${key}Qualification`}
                defaultValue={details[key].qualification}
                required={required}
              />
              {key === "ug" && (
                <div className="student-pursuing-control">
                  <input
                    id="ug-currently-pursuing"
                    name="ugCurrentlyPursuing"
                    type="checkbox"
                    checked={ugCurrentlyPursuing}
                    onChange={(event) => {
                      const isCurrentlyPursuing = event.currentTarget.checked;
                      setUgCurrentlyPursuing(isCurrentlyPursuing);
                      const form = event.currentTarget.form;
                      if (form) {
                        setYearErrors(
                          getEducationYearErrors(
                            new FormData(form),
                            !isCurrentlyPursuing,
                            pgCurrentlyPursuing,
                          ),
                        );
                      }
                    }}
                  />
                  <label htmlFor="ug-currently-pursuing">Currently pursuing this degree</label>
                </div>
              )}
              <label htmlFor={`${key}-completion-year`}>
                {key === "ug" && ugCurrentlyPursuing
                  ? "Expected completion year"
                  : "Completion year"}
              </label>
              <input
                id={`${key}-completion-year`}
                name={`${key}CompletionYear`}
                type="number"
                min={key === "ug" && ugCurrentlyPursuing
                  ? new Date().getFullYear()
                  : "1950"}
                max={key === "ug" && ugCurrentlyPursuing
                  ? undefined
                  : new Date().getFullYear()}
                defaultValue={details[key].completionYear}
                aria-invalid={Boolean(yearErrors[key])}
                aria-describedby={yearErrors[key] ? `${key}-completion-year-error` : undefined}
                onChange={(event) => {
                  const form = event.currentTarget.form;
                  if (form) {
                    setYearErrors(
                      getEducationYearErrors(
                        new FormData(form),
                        !ugCurrentlyPursuing,
                        pgCurrentlyPursuing,
                      ),
                    );
                  }
                }}
                required={required}
              />
              {yearErrors[key] && (
                <p
                  id={`${key}-completion-year-error`}
                  className="student-year-error"
                  role="alert"
                >
                  {yearErrors[key]}
                </p>
              )}
              <label htmlFor={`${key}-score`}>Marks / CGPA</label>
              <input
                id={`${key}-score`}
                name={`${key}Score`}
                placeholder="e.g. 85% or 8.5 CGPA"
                defaultValue={details[key].score}
                required={required}
              />
            </fieldset>
          ))}
          {ugCurrentlyPursuing && (
            <fieldset className="student-details-section student-pg-unavailable">
              <legend>Postgraduate (PG)</legend>
              <div className="student-pg-unavailable-content">
                <span className="student-pg-unavailable-icon" aria-hidden="true">
                  <GraduationCap size={19} />
                </span>
                <div>
                  <span className="student-pg-status">Not applicable yet</span>
                  <p>
                    Add postgraduate details after completing your undergraduate degree.
                  </p>
                </div>
              </div>
            </fieldset>
          )}
          {!ugCurrentlyPursuing && (
            <fieldset className="student-details-section">
              <legend>Postgraduate (PG) (optional)</legend>
              <label htmlFor="pg-institution">Institution name</label>
              <input
                id="pg-institution"
                name="pgInstitution"
                defaultValue={details.pg.institution}
                required={pgCurrentlyPursuing}
              />
              <label htmlFor="pg-qualification">Board / degree / qualification</label>
              <input
                id="pg-qualification"
                name="pgQualification"
                defaultValue={details.pg.qualification}
                required={pgCurrentlyPursuing}
              />
              <div className="student-pursuing-control">
                <input
                  id="pg-currently-pursuing"
                  name="pgCurrentlyPursuing"
                  type="checkbox"
                  checked={pgCurrentlyPursuing}
                  onChange={(event) => {
                    const isCurrentlyPursuing = event.currentTarget.checked;
                    setPgCurrentlyPursuing(isCurrentlyPursuing);
                    const form = event.currentTarget.form;
                    if (form) {
                      setYearErrors(
                        getEducationYearErrors(
                          new FormData(form),
                          !ugCurrentlyPursuing,
                          isCurrentlyPursuing,
                        ),
                      );
                    }
                  }}
                />
                <label htmlFor="pg-currently-pursuing">Currently pursuing this degree</label>
              </div>
              <label htmlFor="pg-completion-year">
                {pgCurrentlyPursuing ? "Expected completion year" : "Completion year"}
              </label>
              <input
                id="pg-completion-year"
                name="pgCompletionYear"
                type="number"
                min={pgCurrentlyPursuing ? new Date().getFullYear() : "1950"}
                max={pgCurrentlyPursuing ? undefined : new Date().getFullYear()}
                defaultValue={details.pg.completionYear}
                aria-invalid={Boolean(yearErrors.pg)}
                aria-describedby={yearErrors.pg ? "pg-completion-year-error" : undefined}
                onChange={(event) => {
                  const form = event.currentTarget.form;
                  if (form) {
                    setYearErrors(
                      getEducationYearErrors(
                        new FormData(form),
                        !ugCurrentlyPursuing,
                        pgCurrentlyPursuing,
                      ),
                    );
                  }
                }}
                required={pgCurrentlyPursuing}
              />
              {yearErrors.pg && (
                <p
                  id="pg-completion-year-error"
                  className="student-year-error"
                  role="alert"
                >
                  {yearErrors.pg}
                </p>
              )}
              <label htmlFor="pg-score">Marks / CGPA</label>
              <input
                id="pg-score"
                name="pgScore"
                placeholder="e.g. 85% or 8.5 CGPA"
                defaultValue={details.pg.score}
              />
            </fieldset>
          )}
        </div>

        <fieldset className="student-details-section student-additional-courses">
          <legend>
            <span className="student-additional-course-legend">
              <span className="student-additional-course-symbol" aria-hidden="true">
                <Plus size={13} strokeWidth={2.5} />
              </span>
              Additional courses (optional)
            </span>
          </legend>
          <p className="student-no-additional-courses">
            Add a course name, organisation, and year for each additional course.
          </p>
          {additionalCourses.map((course, index) => (
            <div className="student-additional-course-entry" key={index}>
              <div className="student-additional-course-heading">
                <h3>Course {index + 1}</h3>
                <button
                  type="button"
                  className="student-remove-course"
                  aria-label={`Remove additional course ${index + 1}`}
                  onClick={() => removeAdditionalCourse(index)}
                >
                  Remove
                </button>
              </div>
              <label htmlFor={`additional-course-${index}-name`}>Course name</label>
              <input
                id={`additional-course-${index}-name`}
                value={course.name}
                required
                onChange={(event) =>
                  updateAdditionalCourse(index, "name", event.currentTarget.value)
                }
              />
              <label htmlFor={`additional-course-${index}-organization`}>Organisation</label>
              <input
                id={`additional-course-${index}-organization`}
                value={course.organization}
                required
                onChange={(event) =>
                  updateAdditionalCourse(index, "organization", event.currentTarget.value)
                }
              />
              <label htmlFor={`additional-course-${index}-year`}>Year</label>
              <input
                id={`additional-course-${index}-year`}
                type="number"
                min="1950"
                max={new Date().getFullYear()}
                value={course.year}
                required
                onChange={(event) =>
                  updateAdditionalCourse(index, "year", event.currentTarget.value)
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="resume-secondary-button student-add-course-button"
            onClick={addAdditionalCourse}
          >
            <Plus size={16} aria-hidden="true" />
            {additionalCourses.length > 0 ? "Add another course" : "Add additional course"}
          </button>
        </fieldset>

        <fieldset className="student-details-section student-experience-section">
          <legend>Work experience (optional)</legend>
          <div className="student-experience-grid">
            <div>
              <label htmlFor="experience-organization">Organization</label>
              <input
                id="experience-organization"
                name="experienceOrganization"
                defaultValue={details.experience.organization}
              />
            </div>
            <div>
              <label htmlFor="experience-role">Role / position</label>
              <input
                id="experience-role"
                name="experienceRole"
                defaultValue={details.experience.role}
              />
            </div>
            <div>
              <label htmlFor="experience-duration">Duration</label>
              <input
                id="experience-duration"
                name="experienceDuration"
                placeholder="e.g. 6 months"
                defaultValue={details.experience.duration}
              />
            </div>
            <div>
              <label htmlFor="experience-description">Brief description</label>
              <textarea
                id="experience-description"
                name="experienceDescription"
                defaultValue={details.experience.description}
              />
            </div>
          </div>
        </fieldset>

        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="primary" type="submit">
          {hasSaved ? "Save changes" : "Save education & experience"}
        </button>
      </form>
      ) : (
        <dl className="student-saved-details">
          {EDUCATION_LEVELS.map(({ key, title }) => {
            const value = key === "pg"
              ? details.ugCurrentlyPursuing
                ? "Not applicable while pursuing UG"
                : `${details.pgCurrentlyPursuing ? "Currently pursuing · " : ""}${[
                    details.pg.qualification,
                    details.pg.institution,
                    details.pg.completionYear,
                    details.pg.score,
                  ].filter(Boolean).join(" · ")}`
              : [
                    details[key].qualification,
                    details[key].institution,
                    details[key].completionYear,
                    details[key].score,
                  ].filter(Boolean).join(" · ");
            return (
              <div key={key}>
                <dt>{title}</dt>
                <dd>{value || "Not added"}</dd>
              </div>
            );
          })}
          <div>
            <dt>Additional courses</dt>
            <dd>
              {details.additionalCourses
                .map((course, index) =>
                  `Course ${index + 1}: ${[
                    course.name,
                    course.organization,
                    course.year,
                  ].filter(Boolean).join(" · ")}`
                )
                .join(" | ") || "Not added"}
            </dd>
          </div>
          <div>
            <dt>Work experience</dt>
            <dd>
              {[
                details.experience.role,
                details.experience.organization,
                details.experience.duration,
                details.experience.description,
              ].filter(Boolean).join(" · ") || "Not added"}
            </dd>
          </div>
        </dl>
      )}
      <p className="profile-details-note">
        Demo only: these details are stored in this browser and are not sent to a server.
      </p>
    </section>
  );
}
